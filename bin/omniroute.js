#!/usr/bin/env node
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { existsSync, statSync, createReadStream } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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
}

function parseArgs(argv) {
  const options = { port: Number(process.env.PORT) || 3000, open: true }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--port' || arg === '-p') {
      options.port = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--port=')) {
      options.port = Number(arg.split('=')[1])
    } else if (arg === '--no-open') {
      options.open = false
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
  -p, --port <number>   Port to serve the dashboard on (default: 3000)
  --no-open             Don't automatically open the dashboard in a browser
  -h, --help            Show this help message
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

function startServer({ port, open }) {
  const server = createServer((req, res) => {
    const requestedPath = decodeURIComponent(req.url.split('?')[0])
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
    console.log(`\n🌟 OmniRoute gateway dashboard running at ${url}\n`)
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

  process.on('SIGINT', () => {
    server.close(() => process.exit(0))
  })
}

function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    printHelp()
    return
  }

  if (!existsSync(distDir) || !existsSync(join(distDir, 'index.html'))) {
    console.error(
      '\nCould not find a built dashboard.\n' +
        'If you are running from source, build it first with:\n\n' +
        '  npm run build\n\n' +
        'Then run `omniroute` again.\n',
    )
    process.exit(1)
  }

  if (!Number.isInteger(options.port) || options.port <= 0) {
    console.error('Invalid --port value. Please provide a positive integer.')
    process.exit(1)
  }

  startServer(options)
}

main()
