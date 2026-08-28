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

## 🔌 Connecting IDE Assistants to OmniRoute

If you're also running an OmniRoute OpenAI-compatible gateway (a separate
process that proxies/routes requests to your LLM providers), you can point
IDE assistants like [Continue](https://continue.dev) at it instead of at a
single provider.

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
merging it into an existing `models` list if you have one, then swap in your
real OmniRoute API key. The `auto` model name tells the gateway to route each
request to the best backend model rather than pinning to one provider.

> Note: this is a client-side config for whatever gateway you have listening
> on that port — it's separate from the `omniroute` dashboard CLI in this
> repo, which serves the tools hub UI rather than an LLM API.

## 📁 Project Structure

```
jarvis-hub/
├── bin/
│   └── omniroute.js      # CLI entry point (serves dist/ and opens the dashboard)
├── examples/
│   └── continue-config.yaml  # Example client config for an OmniRoute gateway
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
