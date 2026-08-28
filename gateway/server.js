// OmniRoute AI gateway: an OpenAI-compatible HTTP API that automatically
// fails over across configured providers (see providers.js) when the
// current one is out of quota, rate-limited, or erroring.
import { createServer } from 'node:http'
import { PROVIDERS, FAILOVER_STATUS_CODES } from './providers.js'

const MAX_LOG_ENTRIES = 25
export const routingLog = []

function recordRoute(entry) {
  routingLog.unshift({ time: new Date().toISOString(), ...entry })
  if (routingLog.length > MAX_LOG_ENTRIES) routingLog.length = MAX_LOG_ENTRIES
}

function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function sendJson(res, status, body) {
  withCors(res)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'))
}

function clientError(message, status = 400) {
  const err = new Error(message)
  err.status = status
  err.clientError = true
  return err
}

async function routeChatCompletion(body) {
  const { model, messages = [], temperature, max_tokens } = body
  if (!Array.isArray(messages) || !messages.length) {
    throw clientError('`messages` is required and must be a non-empty array.')
  }

  // "provider:model" (e.g. "openai:gpt-4o") targets one provider directly,
  // bypassing the fallback chain.
  const explicitMatch = typeof model === 'string' ? model.match(/^([a-z]+):(.+)$/i) : null
  if (explicitMatch) {
    const [, providerId, explicitModel] = explicitMatch
    const provider = PROVIDERS.find((p) => p.id === providerId.toLowerCase())
    if (!provider) {
      throw clientError(`Unknown provider "${providerId}". Known providers: ${PROVIDERS.map((p) => p.id).join(', ')}`)
    }
    if (!provider.isConfigured()) {
      throw clientError(`${provider.label} is not configured (missing API key env var).`, 503)
    }
    const result = await provider.call(messages, { model: explicitModel, temperature, max_tokens })
    recordRoute({ provider: provider.id, model: result.model, requestedModel: model, fellBackFrom: [] })
    return result
  }

  const attempted = []
  let lastError
  for (const provider of PROVIDERS) {
    if (!provider.isConfigured()) continue
    try {
      const result = await provider.call(messages, { model, temperature, max_tokens })
      recordRoute({ provider: provider.id, model: result.model, requestedModel: model || 'auto', fellBackFrom: [...attempted] })
      return result
    } catch (error) {
      attempted.push(provider.id)
      lastError = error
      const shouldFailover = FAILOVER_STATUS_CODES.has(error.status) || !error.status
      if (!shouldFailover) throw error
    }
  }

  if (!attempted.length) {
    throw clientError(
      'No providers are configured. Set at least one provider API key env var (e.g. ANTHROPIC_API_KEY, OPENAI_API_KEY).',
      503,
    )
  }

  const err = new Error(`All configured providers failed. Last error: ${lastError?.message || 'unknown error'}`)
  err.status = 502
  throw err
}

export function createGatewayServer() {
  return createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      withCors(res)
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost')

    if (req.method === 'GET' && (url.pathname === '/status' || url.pathname === '/v1/status')) {
      sendJson(res, 200, {
        providers: PROVIDERS.map((p) => ({ id: p.id, label: p.label, configured: p.isConfigured() })),
        fallbackOrder: PROVIDERS.map((p) => p.id),
        recentRoutes: routingLog,
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/v1/models') {
      sendJson(res, 200, {
        object: 'list',
        data: [
          { id: 'auto', object: 'model', owned_by: 'omniroute' },
          ...PROVIDERS.filter((p) => p.isConfigured()).map((p) => ({ id: p.id, object: 'model', owned_by: 'omniroute' })),
        ],
      })
      return
    }

    if (req.method === 'POST' && url.pathname === '/v1/chat/completions') {
      try {
        const body = await readJsonBody(req)
        const result = await routeChatCompletion(body)

        if (body.stream) {
          // Not real token-by-token streaming: the full response is fetched
          // from the provider first, then emitted as a single SSE chunk so
          // clients built for streaming still work.
          withCors(res)
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          })
          const base = {
            id: result.id,
            object: 'chat.completion.chunk',
            created: result.created,
            model: result.model,
          }
          res.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: { role: 'assistant', content: result.choices[0].message.content }, finish_reason: null }] })}\n\n`)
          res.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] })}\n\n`)
          res.write('data: [DONE]\n\n')
          res.end()
          return
        }

        sendJson(res, 200, result)
      } catch (error) {
        sendJson(res, error.status || 500, {
          error: { message: error.message, type: error.clientError ? 'invalid_request_error' : 'omniroute_error' },
        })
      }
      return
    }

    withCors(res)
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: { message: 'Not found' } }))
  })
}
