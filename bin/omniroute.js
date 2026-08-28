#!/usr/bin/env node
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { existsSync, statSync, createReadStream } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGatewayServer } from '../gateway/server.js'
import { PROVIDERS } from '../gateway/providers.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, '..')
const distDir = join(packageRoot, 'dist')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function parseArgs(argv) {
  const options = {
    port: Number(process.env.PORT) || 3000,
    gatewayPort: Number(process.env.OMNIROUTE_GATEWAY_PORT) || 20128,
    open: true,
    dashboard: true,
    gateway: true,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--port' || arg === '-p') {
      options.port = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--port=')) {
      options.port = Number(arg.split('=')[1])
    } else if (arg === '--gateway-port') {
      options.gatewayPort = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--gateway-port=')) {
      options.gatewayPort = Number(arg.split('=')[1])
    } else if (arg === '--no-open') {
      options.open = false
    } else if (arg === '--no-gateway' || arg === '--dashboard-only') {
      options.gateway = false
    } else if (arg === '--gateway-only') {
      options.dashboard = false
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    }
  }
  return options
}

function printHelp() {
  console.log(`
🌟 OmniRoute — the Jarvis Hub gateway dashboard

Usage:
  omniroute [options]

Options:
  -p, --port <number>          Port to serve the dashboard on (default: 3000)
  --gateway-port <number>      Port for the AI gateway API (default: 20128)
  --no-gateway, --dashboard-only   Only serve the dashboard, skip the AI gateway
  --gateway-only                Only run the AI gateway, skip the dashboard
  --no-open                    Don't automatically open the dashboard in a browser
  -h, --help                   Show this help message

The AI gateway exposes an OpenAI-compatible API at /v1/chat/completions and
automatically fails over across configured providers. Set one or more of
these environment variables before running omniroute to enable it:

  ANTHROPIC_API_KEY   OPENAI_API_KEY   GEMINI_API_KEY (or GOOGLE_API_KEY)
  PERPLEXITY_API_KEY  DEEPSEEK_API_KEY XAI_API_KEY

Fallback order: Claude -> OpenAI -> Gemini -> Perplexity -> DeepSeek -> Grok.
`)
}

function openBrowser(url) {
  const platform = process.platform
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open'
  const args = platform === 'win32' ? ['', url] : [url]

  try {
    const child = spawn(command, args, { shell: platform === 'win32', stdio: 'ignore', detached: true })
    child.on('error', () => {
      // Non-fatal: the dashboard is still reachable at the printed URL.
    })
    child.unref()
  } catch {
    // Ignore — some environments (containers, CI) have no browser to open.
  }
}

function startDashboard({ port, open, gatewayPort, gatewayEnabled }) {
  const server = createServer((req, res) => {
    const requestedPath = decodeURIComponent(req.url.split('?')[0])

    // Tells the built frontend which port the gateway actually landed on,
    // since --gateway-port can differ from the default baked into the build.
    if (requestedPath === '/omniroute-config.json') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ gatewayUrl: gatewayEnabled ? `http://localhost:${gatewayPort}` : null }))
      return
    }

    let filePath = join(distDir, requestedPath === '/' ? 'index.html' : requestedPath)

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      // Single-page app fallback: unknown routes resolve to index.html.
      filePath = join(distDir, 'index.html')
    }

    const ext = extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
    createReadStream(filePath).pipe(res)
  })

  server.listen(port, () => {
    const url = `http://localhost:${port}`
    console.log(`🌟 OmniRoute gateway dashboard running at ${url}`)
    if (open) openBrowser(url)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Try: omniroute --port <number>`)
    } else {
      console.error('Failed to start the OmniRoute dashboard:', err.message)
    }
    process.exit(1)
  })

  return server
}

function startGateway(port) {
  const server = createGatewayServer()

  server.listen(port, () => {
    const configured = PROVIDERS.filter((p) => p.isConfigured())
    console.log(`🔀 OmniRoute AI gateway running at http://localhost:${port}/v1`)
    if (configured.length) {
      console.log(`   Configured providers (fallback order): ${configured.map((p) => p.label).join(' → ')}`)
    } else {
      console.log('   ⚠️  No provider API keys detected — set ANTHROPIC_API_KEY / OPENAI_API_KEY / etc. to enable routing.')
    }
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Gateway port ${port} is already in use. Try: omniroute --gateway-port <number>`)
    } else {
      console.error('Failed to start the OmniRoute AI gateway:', err.message)
    }
    process.exit(1)
  })

  return server
}

function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    printHelp()
    return
  }

  if (!Number.isInteger(options.port) || options.port <= 0) {
    console.error('Invalid --port value. Please provide a positive integer.')
    process.exit(1)
  }
  if (!Number.isInteger(options.gatewayPort) || options.gatewayPort <= 0) {
    console.error('Invalid --gateway-port value. Please provide a positive integer.')
    process.exit(1)
  }

  const servers = []

  if (options.gateway) {
    servers.push(startGateway(options.gatewayPort))
  }

  if (options.dashboard) {
    if (!existsSync(distDir) || !existsSync(join(distDir, 'index.html'))) {
      console.error(
        '\nCould not find a built dashboard.\n' +
          'If you are running from source, build it first with:\n\n' +
          '  npm run build\n\n' +
          'Then run `omniroute` again.\n',
      )
      process.exit(1)
    }
    servers.push(
      startDashboard({
        port: options.port,
        open: options.open,
        gatewayPort: options.gatewayPort,
        gatewayEnabled: options.gateway,
      }),
    )
  }

  process.on('SIGINT', () => {
    Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve)))).then(() => process.exit(0))
  })
}

main()
