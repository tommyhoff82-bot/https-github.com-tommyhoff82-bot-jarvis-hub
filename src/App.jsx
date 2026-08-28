import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Search, Share2, Sparkles, Star, X } from 'lucide-react'

const FAVORITES_KEY = 'jarvis-hub-favorites'

const TOOLS = [
  // AI Assistants
  { id: 'claude', name: 'Claude', category: 'AI Assistants', description: 'Anthropic’s AI assistant for writing, research, and coding.', url: 'https://claude.ai', buttonText: 'Open Claude', tags: ['AI', 'Chat', 'Writing'] },
  { id: 'chatgpt', name: 'ChatGPT', category: 'AI Assistants', description: 'OpenAI’s conversational assistant for everyday tasks.', url: 'https://chat.openai.com', buttonText: 'Open ChatGPT', tags: ['AI', 'Chat'] },
  { id: 'perplexity', name: 'Perplexity', category: 'AI Assistants', description: 'AI-powered answer engine with cited sources.', url: 'https://www.perplexity.ai', buttonText: 'Open Perplexity', tags: ['AI', 'Search', 'Research'] },
  { id: 'gemini', name: 'Gemini', category: 'AI Assistants', description: 'Google’s multimodal AI assistant.', url: 'https://gemini.google.com', buttonText: 'Open Gemini', tags: ['AI', 'Chat'] },
  { id: 'manus', name: 'Manus', category: 'AI Assistants', description: 'Autonomous AI agent for complex, multi-step tasks.', url: 'https://manus.im', buttonText: 'Open Manus', tags: ['AI', 'Agent'] },
  { id: 'copilot', name: 'GitHub Copilot', category: 'AI Assistants', description: 'AI pair programmer built into your editor.', url: 'https://github.com/features/copilot', buttonText: 'Open Copilot', tags: ['AI', 'Code'] },

  // Automation
  { id: 'n8n', name: 'n8n', category: 'Automation', description: 'Self-hostable workflow automation platform.', url: 'https://n8n.io', buttonText: 'Open n8n', tags: ['Automation', 'Workflows'] },
  { id: 'supabase', name: 'Supabase', category: 'Automation', description: 'Open source backend with database, auth, and storage.', url: 'https://supabase.com', buttonText: 'Open Supabase', tags: ['Backend', 'Database'] },
  { id: 'lovable', name: 'Lovable', category: 'Automation', description: 'AI app builder that generates full-stack apps from a prompt.', url: 'https://lovable.dev', buttonText: 'Open Lovable', tags: ['AI', 'App Builder'] },
  { id: 'zapier', name: 'Zapier', category: 'Automation', description: 'Connect apps and automate workflows without code.', url: 'https://zapier.com', buttonText: 'Open Zapier', tags: ['Automation', 'Integrations'] },
  { id: 'make', name: 'Make', category: 'Automation', description: 'Visual platform for building automated workflows.', url: 'https://www.make.com', buttonText: 'Open Make', tags: ['Automation', 'Workflows'] },

  // Voice and Media
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'Voice and Media', description: 'AI voice generation and cloning.', url: 'https://elevenlabs.io', buttonText: 'Open ElevenLabs', tags: ['Voice', 'Audio'] },
  { id: 'whisper', name: 'Whisper', category: 'Voice and Media', description: 'OpenAI’s speech-to-text transcription model.', url: 'https://openai.com/research/whisper', buttonText: 'Open Whisper', tags: ['Voice', 'Transcription'] },
  { id: 'telegram', name: 'Telegram', category: 'Voice and Media', description: 'Messaging platform with bot and automation support.', url: 'https://telegram.org', buttonText: 'Open Telegram', tags: ['Messaging', 'Bots'] },
  { id: 'descript', name: 'Descript', category: 'Voice and Media', description: 'Edit video and podcasts by editing text.', url: 'https://www.descript.com', buttonText: 'Open Descript', tags: ['Video', 'Audio', 'Editing'] },

  // Research
  { id: 'semrush', name: 'Semrush', category: 'Research', description: 'SEO, traffic, and competitive intelligence data.', url: 'https://www.semrush.com', buttonText: 'Open Semrush', tags: ['SEO', 'Research'] },
  { id: 'google-trends', name: 'Google Trends', category: 'Research', description: 'Explore what the world is searching for.', url: 'https://trends.google.com', buttonText: 'Open Google Trends', tags: ['Research', 'Trends'] },
  { id: 'ahrefs', name: 'Ahrefs', category: 'Research', description: 'Backlink analysis and keyword research toolkit.', url: 'https://ahrefs.com', buttonText: 'Open Ahrefs', tags: ['SEO', 'Research'] },

  // Design and Content
  { id: 'canva', name: 'Canva', category: 'Design and Content', description: 'Drag-and-drop design tool for graphics and social content.', url: 'https://www.canva.com', buttonText: 'Open Canva', tags: ['Design', 'Content'] },
  { id: 'capcut', name: 'CapCut', category: 'Design and Content', description: 'Video editor for short-form and social content.', url: 'https://www.capcut.com', buttonText: 'Open CapCut', tags: ['Video', 'Editing'] },
  { id: 'obsidian', name: 'Obsidian', category: 'Design and Content', description: 'Networked note-taking app for connected thinking.', url: 'https://obsidian.md', buttonText: 'Open Obsidian', tags: ['Notes', 'Content'] },

  // Business and Ecommerce
  { id: 'shopify', name: 'Shopify', category: 'Business and Ecommerce', description: 'Ecommerce platform for building and running an online store.', url: 'https://www.shopify.com', buttonText: 'Open Shopify', tags: ['Ecommerce', 'Business'] },
  { id: 'printify', name: 'Printify', category: 'Business and Ecommerce', description: 'Print-on-demand product fulfillment platform.', url: 'https://printify.com', buttonText: 'Open Printify', tags: ['Ecommerce', 'Print on Demand'] },

  // Marketing
  { id: 'buffer', name: 'Buffer', category: 'Marketing', description: 'Schedule and publish social media posts.', url: 'https://buffer.com', buttonText: 'Open Buffer', tags: ['Marketing', 'Social Media'] },
  { id: 'metricool', name: 'Metricool', category: 'Marketing', description: 'Plan, schedule, and analyze social media performance.', url: 'https://metricool.com', buttonText: 'Open Metricool', tags: ['Marketing', 'Analytics'] },
  { id: 'meta-ads', name: 'Meta Ads Manager', category: 'Marketing', description: 'Create and manage ads across Facebook and Instagram.', url: 'https://www.facebook.com/adsmanager', buttonText: 'Open Meta Ads Manager', tags: ['Marketing', 'Ads'] },
  { id: 'google-ads', name: 'Google Ads', category: 'Marketing', description: 'Run search, display, and video ad campaigns.', url: 'https://ads.google.com', buttonText: 'Open Google Ads', tags: ['Marketing', 'Ads'] },
  { id: 'klaviyo', name: 'Klaviyo', category: 'Marketing', description: 'Email and SMS marketing automation.', url: 'https://www.klaviyo.com', buttonText: 'Open Klaviyo', tags: ['Marketing', 'Email'] },
  { id: 'mailchimp', name: 'Mailchimp', category: 'Marketing', description: 'Email marketing and audience management platform.', url: 'https://mailchimp.com', buttonText: 'Open Mailchimp', tags: ['Marketing', 'Email'] },

  // Productivity
  { id: 'notion', name: 'Notion', category: 'Productivity', description: 'All-in-one workspace for notes, docs, and projects.', url: 'https://www.notion.so', buttonText: 'Open Notion', tags: ['Productivity', 'Notes'] },

  // Community and Services
  { id: 'fiverr', name: 'Fiverr', category: 'Community and Services', description: 'Hire freelancers for design, dev, and marketing work.', url: 'https://www.fiverr.com', buttonText: 'Open Fiverr', tags: ['Freelance', 'Services'] },
]

const CATEGORIES = ['All', 'Favorites', ...new Set(TOOLS.map((tool) => tool.category))]

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function ToolCard({ tool, isFavorite, onToggleFavorite }) {
  return (
    <div className="tool-card">
      <div className="tool-card-header">
        <div className="tool-icon">
          <Sparkles size={20} />
        </div>
        <button
          type="button"
          className={`favorite-btn${isFavorite ? ' is-favorite' : ''}`}
          onClick={() => onToggleFavorite(tool.id)}
          aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
        >
          <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <h3 className="tool-name">{tool.name}</h3>
      <p className="tool-description">{tool.description}</p>
      <div className="tool-tags">
        {tool.tags.map((tag) => (
          <span className="tool-tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <a className="tool-link" href={tool.url} target="_blank" rel="noopener noreferrer">
        {tool.buttonText}
        <ExternalLink size={16} />
      </a>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [favorites, setFavorites] = useState(loadFavorites)
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    if (!shareMessage) return
    const timer = setTimeout(() => setShareMessage(''), 2500)
    return () => clearTimeout(timer)
  }, [shareMessage])

  const toggleFavorite = (id) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((favId) => favId !== id) : [...current, id],
    )
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareMessage('Link copied to clipboard!')
    } catch {
      setShareMessage('Copy this page’s URL to share it.')
    }
  }

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return TOOLS.filter((tool) => {
      if (category === 'Favorites' && !favorites.includes(tool.id)) return false
      if (category !== 'All' && category !== 'Favorites' && tool.category !== category) return false

      if (!normalizedQuery) return true
      const haystack = [tool.name, tool.description, ...tool.tags].join(' ').toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [query, category, favorites])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <h1 className="app-title">
            <span aria-hidden="true">🌟</span> Jarvis Hub
          </h1>
          <button type="button" className="share-btn" onClick={handleShare}>
            <Share2 size={16} />
            Share Hub
          </button>
        </div>
        <p className="app-subtitle">
          Your OmniRoute gateway dashboard — one shareable hub for AI tools, automations, and creative apps.
        </p>
        {shareMessage && <div className="share-toast">{shareMessage}</div>}

        <div className="search-bar">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search tools by name, description, or tag..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search tools"
          />
          {query && (
            <button type="button" className="clear-search-btn" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="category-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill${category === cat ? ' is-active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="tool-grid">
        {filteredTools.length === 0 ? (
          <p className="empty-state">No tools match your search.</p>
        ) : (
          filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={favorites.includes(tool.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </main>

      <footer className="app-footer">
        ✨ Powered by Jarvis Hub — Your personal AI tools operating system
      </footer>
    </div>
  )
}
