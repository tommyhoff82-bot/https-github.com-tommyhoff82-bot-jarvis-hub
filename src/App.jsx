import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles,
  Search,
  Star,
  ExternalLink,
  Share2,
  Bot,
  MessageSquare,
  Cpu,
  Workflow,
  Database,
  Rocket,
  Zap,
  Mic,
  Waves,
  Send,
  Scissors,
  TrendingUp,
  BarChart3,
  LineChart,
  Palette,
  Video,
  FileText,
  Layout,
  ShoppingBag,
  Package,
  CreditCard,
  Target,
  Mail,
  Calendar,
  Briefcase,
  Users,
} from 'lucide-react'

const TOOLS = [
  // AI Assistants
  { id: 'claude', name: 'Claude', category: 'AI Assistants', description: 'Anthropic\'s AI assistant for writing, coding, and reasoning.', url: 'https://claude.ai', buttonText: 'Open Claude', tags: ['AI', 'Chat', 'Coding'], icon: Bot, color: '#6366f1' },
  { id: 'chatgpt', name: 'ChatGPT', category: 'AI Assistants', description: 'OpenAI\'s conversational AI for everyday tasks and brainstorming.', url: 'https://chat.openai.com', buttonText: 'Open ChatGPT', tags: ['AI', 'Chat'], icon: MessageSquare, color: '#10b981' },
  { id: 'perplexity', name: 'Perplexity', category: 'AI Assistants', description: 'AI-powered answer engine with cited, real-time search results.', url: 'https://www.perplexity.ai', buttonText: 'Open Perplexity', tags: ['AI', 'Search'], icon: Search, color: '#22d3ee' },
  { id: 'gemini', name: 'Gemini', category: 'AI Assistants', description: 'Google\'s multimodal AI assistant for text, code, and images.', url: 'https://gemini.google.com', buttonText: 'Open Gemini', tags: ['AI', 'Chat'], icon: Sparkles, color: '#3b82f6' },
  { id: 'manus', name: 'Manus', category: 'AI Assistants', description: 'Autonomous AI agent that plans and executes multi-step tasks.', url: 'https://manus.im', buttonText: 'Open Manus', tags: ['AI', 'Agent'], icon: Cpu, color: '#a855f7' },
  { id: 'poe', name: 'Poe', category: 'AI Assistants', description: 'One place to chat with many different AI models.', url: 'https://poe.com', buttonText: 'Open Poe', tags: ['AI', 'Chat'], icon: MessageSquare, color: '#f59e0b' },

  // Automation
  { id: 'n8n', name: 'n8n', category: 'Automation', description: 'Workflow automation tool for connecting apps and APIs.', url: 'https://n8n.io', buttonText: 'Open n8n', tags: ['Automation', 'Workflows'], icon: Workflow, color: '#ea4b71' },
  { id: 'supabase', name: 'Supabase', category: 'Automation', description: 'Open source Postgres backend with auth, storage, and edge functions.', url: 'https://supabase.com', buttonText: 'Open Supabase', tags: ['Backend', 'Database'], icon: Database, color: '#3ecf8e' },
  { id: 'lovable', name: 'Lovable', category: 'Automation', description: 'AI app builder that turns prompts into full-stack apps.', url: 'https://lovable.dev', buttonText: 'Open Lovable', tags: ['Automation', 'App Builder'], icon: Rocket, color: '#f97316' },
  { id: 'zapier', name: 'Zapier', category: 'Automation', description: 'Connects thousands of apps into automated workflows.', url: 'https://zapier.com', buttonText: 'Open Zapier', tags: ['Automation', 'Integrations'], icon: Zap, color: '#ff4a00' },

  // Voice and Media
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'Voice and Media', description: 'Realistic AI voice generation, cloning, and dubbing.', url: 'https://elevenlabs.io', buttonText: 'Open ElevenLabs', tags: ['Voice', 'Audio'], icon: Mic, color: '#111827' },
  { id: 'whisper', name: 'Whisper', category: 'Voice and Media', description: 'OpenAI\'s speech-to-text transcription model.', url: 'https://openai.com/research/whisper', buttonText: 'Open Whisper', tags: ['Transcription', 'Audio'], icon: Waves, color: '#14b8a6' },
  { id: 'telegram', name: 'Telegram', category: 'Voice and Media', description: 'Fast, secure messaging with bot and automation support.', url: 'https://telegram.org', buttonText: 'Open Telegram', tags: ['Messaging'], icon: Send, color: '#229ed9' },
  { id: 'descript', name: 'Descript', category: 'Voice and Media', description: 'Edit audio and video by editing text, like a doc.', url: 'https://www.descript.com', buttonText: 'Open Descript', tags: ['Video', 'Audio'], icon: Scissors, color: '#f43f5e' },

  // Research
  { id: 'semrush', name: 'Semrush', category: 'Research', description: 'SEO, traffic, and competitive intelligence platform.', url: 'https://www.semrush.com', buttonText: 'Open Semrush', tags: ['SEO', 'Research'], icon: TrendingUp, color: '#ff642d' },
  { id: 'google-trends', name: 'Google Trends', category: 'Research', description: 'Explore what the world is searching for, over time.', url: 'https://trends.google.com', buttonText: 'Open Google Trends', tags: ['Research', 'Trends'], icon: BarChart3, color: '#4285f4' },
  { id: 'google-analytics', name: 'Google Analytics', category: 'Research', description: 'Website traffic and user behavior analytics.', url: 'https://analytics.google.com', buttonText: 'Open Analytics', tags: ['Analytics'], icon: LineChart, color: '#f9ab00' },

  // Design and Content
  { id: 'canva', name: 'Canva', category: 'Design and Content', description: 'Drag-and-drop design tool for graphics, docs, and video.', url: 'https://www.canva.com', buttonText: 'Open Canva', tags: ['Design', 'Content'], icon: Palette, color: '#00c4cc' },
  { id: 'capcut', name: 'CapCut', category: 'Design and Content', description: 'Video editor for social-ready clips and captions.', url: 'https://www.capcut.com', buttonText: 'Open CapCut', tags: ['Video', 'Editing'], icon: Video, color: '#000000' },
  { id: 'notion', name: 'Notion', category: 'Design and Content', description: 'All-in-one workspace for notes, docs, and wikis.', url: 'https://www.notion.so', buttonText: 'Open Notion', tags: ['Docs', 'Content'], icon: FileText, color: '#111827' },
  { id: 'figma', name: 'Figma', category: 'Design and Content', description: 'Collaborative interface design and prototyping tool.', url: 'https://www.figma.com', buttonText: 'Open Figma', tags: ['Design', 'UI'], icon: Layout, color: '#a259ff' },

  // Business and Ecommerce
  { id: 'shopify', name: 'Shopify', category: 'Business and Ecommerce', description: 'Ecommerce platform for building and running online stores.', url: 'https://www.shopify.com', buttonText: 'Open Shopify', tags: ['Ecommerce'], icon: ShoppingBag, color: '#95bf47' },
  { id: 'printify', name: 'Printify', category: 'Business and Ecommerce', description: 'Print-on-demand product creation and fulfillment.', url: 'https://printify.com', buttonText: 'Open Printify', tags: ['Ecommerce', 'POD'], icon: Package, color: '#e2361f' },
  { id: 'stripe', name: 'Stripe', category: 'Business and Ecommerce', description: 'Payments infrastructure for online businesses.', url: 'https://stripe.com', buttonText: 'Open Stripe', tags: ['Payments'], icon: CreditCard, color: '#635bff' },

  // Marketing
  { id: 'buffer', name: 'Buffer', category: 'Marketing', description: 'Schedule and publish posts across social platforms.', url: 'https://buffer.com', buttonText: 'Open Buffer', tags: ['Social', 'Scheduling'], icon: Share2, color: '#2c4bff' },
  { id: 'metricool', name: 'Metricool', category: 'Marketing', description: 'Plan, schedule, and analyze social media performance.', url: 'https://metricool.com', buttonText: 'Open Metricool', tags: ['Social', 'Analytics'], icon: BarChart3, color: '#ff6b57' },
  { id: 'meta-ads', name: 'Meta Ads Manager', category: 'Marketing', description: 'Create and manage ad campaigns across Meta platforms.', url: 'https://www.facebook.com/adsmanager', buttonText: 'Open Meta Ads', tags: ['Ads', 'Marketing'], icon: Target, color: '#0866ff' },
  { id: 'google-ads', name: 'Google Ads', category: 'Marketing', description: 'Run search, display, and video ad campaigns on Google.', url: 'https://ads.google.com', buttonText: 'Open Google Ads', tags: ['Ads', 'Marketing'], icon: Target, color: '#34a853' },
  { id: 'klaviyo', name: 'Klaviyo', category: 'Marketing', description: 'Email and SMS marketing automation for ecommerce.', url: 'https://www.klaviyo.com', buttonText: 'Open Klaviyo', tags: ['Email', 'Marketing'], icon: Mail, color: '#0b1c33' },

  // Productivity
  { id: 'obsidian', name: 'Obsidian', category: 'Productivity', description: 'Local-first, linked note-taking for your personal knowledge base.', url: 'https://obsidian.md', buttonText: 'Open Obsidian', tags: ['Notes', 'Productivity'], icon: FileText, color: '#7c3aed' },
  { id: 'google-calendar', name: 'Google Calendar', category: 'Productivity', description: 'Schedule, share, and manage events and meetings.', url: 'https://calendar.google.com', buttonText: 'Open Calendar', tags: ['Scheduling'], icon: Calendar, color: '#1a73e8' },

  // Community and Services
  { id: 'fiverr', name: 'Fiverr', category: 'Community and Services', description: 'Hire freelancers for design, writing, dev, and more.', url: 'https://www.fiverr.com', buttonText: 'Open Fiverr', tags: ['Freelance', 'Services'], icon: Briefcase, color: '#1dbf73' },
  { id: 'upwork', name: 'Upwork', category: 'Community and Services', description: 'Find and hire freelance talent for any project.', url: 'https://www.upwork.com', buttonText: 'Open Upwork', tags: ['Freelance', 'Services'], icon: Users, color: '#14a800' },
]

const CATEGORIES = [...new Set(TOOLS.map((t) => t.category))]

const FAVORITES_KEY = 'jarvis-hub:favorites'

function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]))
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, [favorites])

  const toggle = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return [favorites, toggle]
}

function ToolCard({ tool, isFavorite, onToggleFavorite }) {
  const Icon = tool.icon
  return (
    <div className="card">
      <div className="card-top">
        <span className="card-icon" style={{ background: tool.color }}>
          <Icon size={22} />
        </span>
        <button
          type="button"
          className={`fav-btn${isFavorite ? ' is-fav' : ''}`}
          aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(tool.id)}
        >
          <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <h3 className="card-name">{tool.name}</h3>
      <p className="card-desc">{tool.description}</p>
      <div className="tags">
        {tool.tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <a className="card-btn" href={tool.url} target="_blank" rel="noopener noreferrer">
        {tool.buttonText}
        <ExternalLink size={15} />
      </a>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favorites, toggleFavorite] = useFavorites()
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TOOLS.filter((tool) => {
      if (showFavoritesOnly && !favorites.has(tool.id)) return false
      if (activeCategory !== 'All' && tool.category !== activeCategory) return false
      if (!q) return true
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [query, activeCategory, showFavoritesOnly, favorites])

  const groupedByCategory = useMemo(() => {
    const groups = new Map()
    for (const tool of filteredTools) {
      if (!groups.has(tool.category)) groups.set(tool.category, [])
      groups.get(tool.category).push(tool)
    }
    return groups
  }, [filteredTools])

  const handleShare = async () => {
    const shareData = {
      title: 'Jarvis Hub',
      text: 'Check out Jarvis Hub - a single hub for AI, automation, and creative tools.',
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
      await navigator.clipboard.writeText(shareData.url)
      setToast('Link copied to clipboard')
    } catch {
      // user cancelled share, or clipboard unavailable - nothing to do
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">
              <Sparkles size={20} color="white" />
            </span>
            Jarvis Hub
            <span className="brand-sub">Your personal AI tools operating system</span>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className={`icon-btn${showFavoritesOnly ? ' active' : ''}`}
              onClick={() => setShowFavoritesOnly((v) => !v)}
              aria-pressed={showFavoritesOnly}
            >
              <Star size={16} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
              Favorites
            </button>
            <button type="button" className="icon-btn" onClick={handleShare}>
              <Share2 size={16} />
              Share Hub
            </button>
          </div>
        </div>
      </header>

      <div className="search-wrap">
        <div className="search-box">
          <Search size={18} />
          <input
            className="search-input"
            type="text"
            placeholder="Search tools by name, description, or tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tools"
          />
        </div>
      </div>

      <div className="categories">
        <button
          type="button"
          className={`chip${activeCategory === 'All' ? ' active' : ''}`}
          onClick={() => setActiveCategory('All')}
        >
          All
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`chip${activeCategory === category ? ' active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <main>
        {filteredTools.length === 0 ? (
          <div className="empty-state">
            <h3>No tools found</h3>
            <p>Try a different search term or category.</p>
          </div>
        ) : activeCategory !== 'All' ? (
          <div className="grid">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={favorites.has(tool.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          [...groupedByCategory.entries()].map(([category, tools]) => (
            <section key={category}>
              <div className="section-title">{category}</div>
              <div className="grid">
                {tools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    isFavorite={favorites.has(tool.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <footer>Powered by Jarvis Hub - Your personal AI tools operating system</footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
