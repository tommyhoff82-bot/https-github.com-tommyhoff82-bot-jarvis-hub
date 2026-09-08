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

### Installation

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

This creates a `dist` folder with optimized production files.

## 📁 Project Structure

```
jarvis-hub/
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

## 🏗️ AI Commerce OS

`ai-commerce-os/` is a separate, full-stack sub-project: a self-learning,
automated e-commerce SaaS scaffold (Next.js frontend + FastAPI backend,
LangGraph agents, Pinecone-backed pattern learning, Shopify/Printify/Stripe
integrations). See `ai-commerce-os/MASTER_GUIDE.md` for the full build and
run instructions.

---

✨ **Powered by Jarvis Hub** - Your personal AI tools operating system
