# 🌟 Jarvis Hub

A modern, premium web app that serves as a single shareable hub to access AI tools, automations, creative apps, research tools, marketing tools, and business tools.

## ✨ Features

- **Dark Mode Design** - Clean, modern interface with glassmorphism accents
- **30+ Tools Organized** into 9 intuitive categories
- **Favorites System** - Pin your most-used tools for quick access
- **Search Functionality** - Find tools by name, description, or tags
- **Mobile Responsive** - Optimized for desktop, tablet, and mobile
- **Share Hub** - Easily share your tools hub with others
- **Icon-Based Cards** - Beautiful gradient icons and soft shadows
- **Fast Loading** - Built with React and Vite for optimal performance
- **Installable App** - Add it to your dock/home screen like a native app
- **AI Gateway with Automatic Failover** - Route requests across Claude,
  OpenAI, Gemini, Perplexity, DeepSeek, and Grok, with automatic failover
  when one runs out of quota

## 🎯 Categories

- **AI Assistants** - Claude, ChatGPT, Perplexity, Gemini, Manus
- **Automation** - n8n, Supabase, Lovable
- **Voice and Media** - ElevenLabs, Whisper, Telegram
- **Research** - Semrush, Google Trends
- **Design and Content** - Canva, CapCut, Obsidian
- **Business and Ecommerce** - Shopify, Printify
- **Marketing** - Buffer, Metricool, Meta Ads Manager, Google Ads, Klaviyo
- **Productivity** - Obsidian
- **Community and Services** - Fiverr

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Option A: Install globally via npm

Jarvis Hub ships as the `omniroute` CLI — install it once and launch the gateway dashboard from anywhere:

```bash
npm install -g omniroute

# Start the gateway dashboard
omniroute
```

This builds/serves the dashboard and opens it at `http://localhost:3000`. Useful flags:

```bash
omniroute --port 4000   # serve on a custom port
omniroute --no-open     # don't auto-open a browser
omniroute --help        # see all options
```

### Option B: Run from source

1. Clone the repository:
```bash
git clone https://github.com/tommyhoff82-bot/jarvis-hub.git
cd jarvis-hub
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates a `dist` folder with optimized production files. Once built, you can also serve it the same way the global CLI does:

```bash
npm start
```

## 📲 Accessing & Installing the Dashboard as an App

Once `omniroute` is running (see above), the dashboard of your connected
resources is just a web page at `http://localhost:3000` (or whatever
`--port` you passed) — open that URL in your browser to see it any time the
CLI is running.

To save it as an actual app instead of a browser tab, the dashboard ships
with a web app manifest, icon, and service worker, so browsers offer a
native "install" option:

- **Chrome / Edge (desktop)**: with the dashboard open, click the install
  icon (⊕ or a small monitor icon) at the right of the address bar, or open
  the browser menu → "Install Jarvis Hub…" / "Apps → Install this site as
  an app". It then opens in its own window and gets a launcher icon like
  any other installed app.
- **Chrome (Android)**: open the ⋮ menu → "Add to Home screen" / "Install
  app".
- **Safari (iOS)**: tap the Share icon → "Add to Home Screen".

Once installed, it launches standalone (no browser chrome) and keeps
working offline for the shell UI, since it's served by a small local
service worker. You still need `omniroute` running locally for the tool
links and any live data — installing it just gives you an app icon/window
instead of a bookmark.

## 🔀 AI Gateway & Automatic Failover

Running `omniroute` doesn't just start the dashboard — it also starts a
small OpenAI-compatible **AI gateway** (default `http://localhost:20128/v1`)
that automatically fails over across AI providers when one is out of quota,
rate-limited, or erroring, so other tools and scripts you point at it don't
just stop working when a single provider runs dry.

**Fallback order:** Claude (Anthropic) → ChatGPT (OpenAI) → Gemini (Google)
→ Perplexity → DeepSeek → Grok (xAI).

### Enabling it

Set an API key for any providers you have, as environment variables before
running `omniroute` (see `.env.example`):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=...       # or GOOGLE_API_KEY
export PERPLEXITY_API_KEY=...
export DEEPSEEK_API_KEY=...
export XAI_API_KEY=...

omniroute
```

You don't need all of them — the gateway only routes to providers whose key
is set, in the order above. With zero keys set, the gateway still starts but
returns a clear error on requests until you add at least one.

### Using it

Send standard OpenAI-shaped chat completion requests:

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

- `"model": "auto"` tries providers in fallback order until one succeeds.
- `"model": "openai:gpt-4o"` (or `anthropic:`, `gemini:`, `perplexity:`,
  `deepseek:`, `grok:`) targets one provider directly, bypassing failover.
- `GET /status` returns which providers are configured and a log of recent
  routing decisions (which provider served each request, and what it fell
  back from).
- `GET /v1/models` lists `auto` plus each configured provider.

Other flags: `--gateway-port <number>` to change the port, `--no-gateway` /
`--dashboard-only` to run just the dashboard, `--gateway-only` to run just
the API with no UI.

**Limitations to know about:** streaming (`"stream": true`) returns the
full response as a single chunk rather than real token-by-token streaming;
and this is local, unauthenticated routing between your own provider keys —
it's not a way to get around a provider's usage limits, just a way to keep
working on a different provider when one runs out.

### Connecting IDE assistants (e.g. Continue)

An example config is provided at
[`examples/continue-config.yaml`](examples/continue-config.yaml):

```yaml
models:
  - name: OmniRoute - Auto
    provider: openai
    model: auto
    apiBase: http://localhost:20128/v1
    apiKey: your_omniroute_api_key_here
```

Copy the `models` entry into your Continue config (`~/.continue/config.yaml`),
merging it into an existing `models` list if you have one. The gateway
doesn't check the `apiKey` field itself (it's meant to run locally, trusted),
so any placeholder value works — the real provider keys live in your
environment variables, per above.

## 📁 Project Structure

```
jarvis-hub/
├── bin/
│   └── omniroute.js      # CLI entry point (starts the gateway + dashboard)
├── gateway/
│   ├── providers.js      # Provider adapters + fallback order
│   └── server.js         # OpenAI-compatible API with automatic failover
├── examples/
│   └── continue-config.yaml  # Example client config for the OmniRoute gateway
├── public/
│   ├── manifest.webmanifest  # Installable-app manifest
│   ├── icon.svg           # App icon
│   └── sw.js               # Service worker (offline shell + installability)
├── src/
│   ├── App.jsx           # Main React component
│   ├── index.css         # Global styles
│   └── main.jsx          # React entry point
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md            # This file
```

## 🎨 Design Features

- **Gradient UI** - Indigo and pink accent colors
- **Soft Shadows** - Subtle depth with box shadows
- **Rounded Corners** - 0.75rem border radius on cards
- **Backdrop Blur** - Glassmorphism effects
- **Smooth Animations** - Fade-in and hover transitions
- **Responsive Grid** - Auto-fill columns that adapt to screen size

## 🔧 Customization

### Adding New Tools

Edit `src/App.jsx` and add to the `TOOLS` array:

```javascript
{
  id: 'unique-id',
  name: 'Tool Name',
  category: 'Category Name',
  description: 'Short description of the tool',
  url: 'https://tool-url.com',
  buttonText: 'Open Tool Name',
  tags: ['Tag1', 'Tag2'],
}
```

### Changing Colors

Edit CSS variables in `src/index.css`:

```css
:root {
  --primary: #6366f1;
  --accent: #ec4899;
  --bg-primary: #0f172a;
  /* ... more colors ... */
}
```

## 🔐 Future Features

- **Supabase Authentication** - Login with email/GitHub
- **User Favorites Persistence** - Save favorites per user
- **Recently Used Section** - Track your most-used tools
- **n8n Integration** - Run automations directly from the hub
- **Admin Mode** - Edit tool links and descriptions
- **Dark/Light Mode Toggle** - Theme switching
- **Custom Tool Collections** - Create shared collections

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Vercel automatically deploys on push

### Deploy to GitHub Pages

```bash
npm run build
git add dist
git commit -m "Build for deployment"
git push origin main
```

### Deploy to Netlify

1. Connect GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

## 📦 Dependencies

- **react** (v18.2.0) - UI framework
- **react-dom** (v18.2.0) - React DOM renderer
- **lucide-react** (v0.263.1) - Icon library
- **vite** (v4.4.9) - Build tool

## 📄 License

This project is open source and available under the MIT License.

## 🙋 Support

For questions or suggestions, feel free to open an issue on GitHub.

---

✨ **Powered by Jarvis Hub** - Your personal AI tools operating system
