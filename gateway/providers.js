// Provider adapters for the OmniRoute AI gateway.
//
// Each provider normalizes to/from the OpenAI chat-completion shape so the
// gateway can expose one consistent OpenAI-compatible API regardless of
// which backend actually served a request. Order in PROVIDERS below is the
// fallback chain used when a request asks for the "auto" model.

const REQUEST_TIMEOUT_MS = 30000

// Status codes worth trying the next provider for: auth problems, quota /
// rate limits, and upstream server errors. Anything else (e.g. a 400 from a
// malformed request) is almost certainly the caller's fault and is returned
// immediately instead of masking it behind five more failed attempts.
export const FAILOVER_STATUS_CODES = new Set([401, 403, 408, 409, 429, 500, 502, 503, 504])

async function fetchJson(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    const text = await res.text()
    let json
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { raw: text }
    }
    return { ok: res.ok, status: res.status, json }
  } finally {
    clearTimeout(timer)
  }
}

function upstreamError(label, status, json) {
  const message = json?.error?.message || json?.message || `${label} request failed with status ${status}`
  const err = new Error(message)
  err.status = status
  return err
}

function buildCompletion({ id, model, content, finishReason = 'stop', usage }) {
  return {
    id: id || `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: finishReason }],
    usage: usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  }
}

// Shared adapter for the many APIs that already speak OpenAI's schema
// (OpenAI itself, Perplexity, DeepSeek, and xAI/Grok all do).
function openAICompatibleProvider({ id, label, envKey, modelEnvKey, defaultModel, baseUrl }) {
  return {
    id,
    label,
    isConfigured: () => Boolean(process.env[envKey]),
    async call(messages, { model, temperature, max_tokens } = {}) {
      const apiKey = process.env[envKey]
      const resolvedModel = model && model !== 'auto' ? model : process.env[modelEnvKey] || defaultModel
      const { ok, status, json } = await fetchJson(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: resolvedModel, messages, temperature, max_tokens }),
      })
      if (!ok) throw upstreamError(label, status, json)
      json.model = json.model || resolvedModel
      return json
    },
  }
}

function anthropicProvider() {
  const envKey = 'ANTHROPIC_API_KEY'
  const modelEnvKey = 'ANTHROPIC_MODEL'
  const defaultModel = 'claude-3-5-sonnet-latest'
  return {
    id: 'anthropic',
    label: 'Claude (Anthropic)',
    isConfigured: () => Boolean(process.env[envKey]),
    async call(messages, { model, temperature, max_tokens } = {}) {
      const apiKey = process.env[envKey]
      const resolvedModel = model && model !== 'auto' ? model : process.env[modelEnvKey] || defaultModel
      const system = messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n')
      const chatMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

      const { ok, status, json } = await fetchJson('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: resolvedModel,
          system: system || undefined,
          messages: chatMessages,
          max_tokens: max_tokens || 1024,
          temperature,
        }),
      })
      if (!ok) throw upstreamError('Anthropic', status, json)

      const content = (json.content || []).map((block) => block.text || '').join('')
      return buildCompletion({
        id: json.id,
        model: resolvedModel,
        content,
        finishReason: json.stop_reason === 'end_turn' ? 'stop' : json.stop_reason,
        usage: json.usage && {
          prompt_tokens: json.usage.input_tokens,
          completion_tokens: json.usage.output_tokens,
          total_tokens: (json.usage.input_tokens || 0) + (json.usage.output_tokens || 0),
        },
      })
    },
  }
}

function geminiProvider() {
  const modelEnvKey = 'GEMINI_MODEL'
  const defaultModel = 'gemini-1.5-flash'
  const getKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  return {
    id: 'gemini',
    label: 'Gemini (Google)',
    isConfigured: () => Boolean(getKey()),
    async call(messages, { model, temperature, max_tokens } = {}) {
      const apiKey = getKey()
      const resolvedModel = model && model !== 'auto' ? model : process.env[modelEnvKey] || defaultModel
      const system = messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n')
      const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`
      const { ok, status, json } = await fetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          generationConfig: { temperature, maxOutputTokens: max_tokens },
        }),
      })
      if (!ok) throw upstreamError('Gemini', status, json)

      const candidate = json.candidates?.[0]
      const content = (candidate?.content?.parts || []).map((p) => p.text || '').join('')
      return buildCompletion({
        model: resolvedModel,
        content,
        finishReason: candidate?.finishReason ? candidate.finishReason.toLowerCase() : 'stop',
        usage: json.usageMetadata && {
          prompt_tokens: json.usageMetadata.promptTokenCount,
          completion_tokens: json.usageMetadata.candidatesTokenCount,
          total_tokens: json.usageMetadata.totalTokenCount,
        },
      })
    },
  }
}

// Fallback order: Claude -> OpenAI -> Gemini -> Perplexity -> DeepSeek -> Grok.
export const PROVIDERS = [
  anthropicProvider(),
  openAICompatibleProvider({
    id: 'openai',
    label: 'ChatGPT (OpenAI)',
    envKey: 'OPENAI_API_KEY',
    modelEnvKey: 'OPENAI_MODEL',
    defaultModel: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  }),
  geminiProvider(),
  openAICompatibleProvider({
    id: 'perplexity',
    label: 'Perplexity',
    envKey: 'PERPLEXITY_API_KEY',
    modelEnvKey: 'PERPLEXITY_MODEL',
    defaultModel: 'sonar',
    baseUrl: 'https://api.perplexity.ai',
  }),
  openAICompatibleProvider({
    id: 'deepseek',
    label: 'DeepSeek',
    envKey: 'DEEPSEEK_API_KEY',
    modelEnvKey: 'DEEPSEEK_MODEL',
    defaultModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
  }),
  openAICompatibleProvider({
    id: 'grok',
    label: 'Grok (xAI)',
    envKey: 'XAI_API_KEY',
    modelEnvKey: 'XAI_MODEL',
    defaultModel: 'grok-2-latest',
    baseUrl: 'https://api.x.ai/v1',
  }),
]
