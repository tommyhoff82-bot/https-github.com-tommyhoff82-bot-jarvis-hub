# 🚀 AI Commerce OS — Complete Build Guide
### Self-Learning Automated E-commerce SaaS Platform · Version 2.0 · September 2026

Reassembled from 33 sequential build-guide emails sent to this inbox from
`hoffinternational007@gmail.com`, subjects `1`–`35`. **Parts 11 and 29 do
not exist** — the sequence genuinely skips them (10→12, 28→30); confirmed
by re-reading the full thread list, not a fetch error.

This file is the narrative/setup guide. The actual code from each part now
lives in `backend/` and `frontend/` as real, runnable files (see the map
below) — this doc won't repeat code that's already in the repo.

**Total time to launch:** 7 days · **Cost to start:** ~$50/month (API + hosting)

---

## Phase 1 — Account Setup (Part 1) · Day 1, ~2 hours

Create these accounts, in order, before writing any code:

| # | Service | Purpose | Cost | Env var(s) |
|---|---------|---------|------|------------|
| 1 | [GitHub](https://github.com/signup) | Code storage | Free | — |
| 2 | [Supabase](https://supabase.com/signup) | Postgres database | Free | `DATABASE_URL` |
| 3 | [Upstash](https://console.upstash.com/signup) | Redis queue | Free | `REDIS_URL` |
| 4 | [OpenAI](https://platform.openai.com/signup) | AI brain (add $10 credit) | Pay-as-you-go | `OPENAI_API_KEY` |
| 5 | [Pinecone](https://www.pinecone.io/start-free/) | Self-learning vector memory (index `commerce-learnings`, dim 1536, cosine) | Free | `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT` |
| 6 | [Stripe](https://dashboard.stripe.com/register) | Payments (test mode) | Free | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| 7 | [Shopify Partners](https://partners.shopify.com/signup) | Store creation (24-48h approval) | Free | `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET` |
| 8 | [Printify](https://printify.com/app/signup) | Order fulfillment | Free | `PRINTIFY_API_KEY` |

Save every key — you should end up with 10 (some services issue more than
one). A filled-in template lives at `backend/.env.example` and
`frontend/.env.local.example`.

## Phase 2 — Install Software (Part 2) · Day 1, ~30 min

In order: **Node.js 20+**, **Python 3.11+** (check "Add Python to PATH" on
Windows), **Git**, **VS Code**. Verify with `node --version`,
`python --version`, `git --version`.

## Phase 3 — Project Structure (Part 2)

```bash
cd ~/Desktop
mkdir ai-commerce-os && cd ai-commerce-os
git init
mkdir -p frontend/app/dashboard frontend/app/onboarding frontend/app/billing \
         frontend/components/ui frontend/components/agents frontend/lib frontend/public \
         backend/agents backend/workers backend/api/routes backend/api/webhooks backend/integrations
```

This repo already reflects that layout under `ai-commerce-os/` (a couple of
folders — `frontend/app/billing`, `frontend/components/agents`,
`backend/integrations` — were scaffolded in the guide but no file for them
ever arrived in the email sequence, so they're not recreated here; add them
when you build those features).

## Code map — email part → file in this repo

| Part | Contents | File |
|------|----------|------|
| 3 | Prisma schema (data model) | `backend/schema.prisma` |
| 4 | Python dependencies | `backend/requirements.txt` |
| 5 | Backend env template | `backend/.env.example` |
| 6 | DB connection helper | `backend/db.py` |
| 7 | Pinecone vector memory | `backend/vector_db.py` |
| 8 | FastAPI app entrypoint | `backend/main.py` |
| 9 | Scout agent (LangGraph) | `backend/agents/scout.py` |
| 10 | Pattern-learning worker | `backend/workers/learner.py` |
| 12 | Stripe billing routes | `backend/api/routes/billing.py` |
| 13 | Shopify → Printify order webhook | `backend/api/webhooks/shopify.py` |
| 14 | Backend Dockerfile | `backend/Dockerfile` |
| 15 | Frontend package.json | `frontend/package.json` |
| 16 | Frontend env template | `frontend/.env.local.example` |
| 17 | Next.js config | `frontend/next.config.js` |
| 18 | TypeScript config | `frontend/tsconfig.json` |
| 19 | Tailwind config | `frontend/tailwind.config.js` |
| 20 | Global styles | `frontend/app/globals.css` |
| 21 | Root layout | `frontend/app/layout.tsx` |
| 22 | API client | `frontend/lib/api.ts` |
| 23 | Landing page | `frontend/app/page.tsx` |
| 24 | Onboarding flow | `frontend/app/onboarding/page.tsx` |
| 25 | Dashboard | `frontend/app/dashboard/page.tsx` |
| 26–28 | Local run commands | see "Run it locally" below |
| 30 | Push to GitHub | see "Ship it" below |
| 31–33 | Launch copy & pitch | `MARKETING.md` |
| 34 | Install (redux) | see "Run it locally" below |
| 35 | Wrap-up checklist | this file |

**Gaps worth knowing about, since the emails jump straight to working
code:** `main.py` (Part 8) never actually wired the billing/Shopify routers
in — I added `app.include_router(...)` calls for both so the endpoints in
Parts 12–13 are reachable, and the `components/ui/button.tsx`, `card.tsx`,
`input.tsx` used throughout the frontend pages were referenced but never
sent — I added minimal Tailwind-based stand-ins so the app actually
compiles. `postcss.config.js` was likewise required by Tailwind but never
included. Everything else in that original set is verbatim from the emails
(with a handful of stray `=` characters restored — e.g. `days=30`,
`status_code=401` — that the plain-text export of the original emails had
silently dropped).

## What's been added beyond the emails (real auth + real integrations)

The email sequence describes a single-tenant demo: one hardcoded
`workspace_id = "ws_123"`, no login, one global set of API keys. This repo
is meant to be a **self-hosted template** other people deploy for their own
business — that needs real auth even with a single operator, so the
following is now real, working code, not scaffolding:

- **Auth** (`backend/auth.py`, `backend/api/routes/auth.py`): bcrypt
  password hashing, JWT sessions, `POST /api/auth/signup`,
  `POST /api/auth/login`, `GET /api/auth/me`. Every route that touches a
  workspace now requires a valid token and checks `require_workspace_owner`
  before doing anything — workspace IDs are otherwise guessable.
- **Workspace creation is now real**: `POST /api/workspaces` persists to
  Postgres via Prisma (it used to just print and return a fake ID).
- **Agent runs are now recorded**: triggering Scout or the Learner creates
  a real `AgentTask` row, updates it to `completed`/`failed`, and
  `GET /api/agents/tasks` reads that table instead of returning two
  hardcoded fake rows.
- **`/api/learning/insights` computes real numbers** from `AIDecision` /
  `Learning` rows for the workspace, instead of always returning the same
  canned `+18%` example.
- **`backend/integrations/shopify.py`** and **`printify.py`**: proper API
  clients (product creation, order lookup, catalog browsing) instead of
  the one-off inline `httpx` call that used to live in the webhook
  handler. The Shopify client is looked up per-workspace from the
  `Integration` table, not a single global token — since this is a
  template, everyone who deploys it eventually connects their own store.
- **Frontend**: `/login`, `/signup` pages, an `AuthProvider` context
  (`frontend/lib/auth.tsx`) backing a `RequireAuth` wrapper that gates
  `/dashboard`, `/agents`, `/billing`, `/onboarding`; a real `/agents` page
  (`AgentCard` + `AgentTaskList` components) to trigger and watch agent
  runs; a real `/billing` page reading live plans from
  `GET /api/billing/plans` and redirecting into actual Stripe Checkout.
- **`GET /api/billing/plans`**: pricing tiers now live once, in
  `backend/api/routes/billing.py`, instead of being hardcoded separately
  in the landing page AND a billing page that would drift apart.
- The Stripe webhook now actually sets `workspace.subscriptionTier` on a
  completed checkout, matched against the price ID that was paid for.

## Connecting your own store (`/settings/integrations`)

Each workspace now connects its own Shopify store and Printify account
from the app itself — `POST /api/integrations/shopify` and
`/api/integrations/printify` validate the credential against the real API
(fetches the shop, or checks the key can see the given shop ID) before
saving it to that workspace's `Integration` row, so a bad token fails at
connect time with a clear message instead of failing silently on the next
order. `GET /api/integrations` never returns the stored token/key back to
the client. This closes the gap where `get_client_for_workspace` always
returned `None` — Scout and any future product-push code now resolve a
real, workspace-scoped Shopify client once a store is connected.

Two things this does *not* do: it doesn't use Shopify OAuth (you paste in
a custom app's Admin API access token instead — simpler for a self-hosted
template, no redirect flow to build/host), and the Shopify order webhook
(`api/webhooks/shopify.py`) still fulfills through the single
`PRINTIFY_SHOP_ID`/`PRINTIFY_API_KEY` in `.env` rather than routing to the
specific workspace an order belongs to — fine for one active store per
deployment, a real limitation the moment more than one workspace connects
its own Shopify store on the same deployment and expects orders to
fulfill through its own Printify account.

**Still not done, and worth being direct about:** no password reset flow,
no email verification, no rate limiting on login/signup. Treat this as
"auth and data are real," not "production hardened."

### New files (not from any email)

| File | Purpose |
|------|---------|
| `backend/auth.py` | Password hashing, JWT issue/verify, `get_current_user` / `require_workspace_owner` dependencies |
| `backend/api/routes/auth.py` | `/api/auth/signup`, `/login`, `/me` |
| `backend/integrations/shopify.py` | Per-workspace Shopify Admin API client |
| `backend/integrations/printify.py` | Printify catalog + order-submission client |
| `backend/api/routes/integrations.py` | Validate + save a workspace's own Shopify/Printify credentials |
| `frontend/app/settings/integrations/page.tsx` | UI to connect/disconnect a workspace's store |
| `frontend/lib/auth.tsx` | `AuthProvider` / `useAuth()` — token + session state |
| `frontend/components/RequireAuth.tsx` | Route guard: redirects to `/login` or `/onboarding` as needed |
| `frontend/app/login/page.tsx`, `signup/page.tsx` | Real sign-in / sign-up forms |
| `frontend/app/agents/page.tsx` + `components/agents/*` | Trigger Scout/Learner, watch task history |
| `frontend/app/billing/page.tsx` | Live plans + real Stripe Checkout redirect |
| `frontend/public/logo.svg`, `robots.txt` | Static assets the `mkdir -p frontend/public` step never got filled |

## Run it locally (Parts 26–28, 34)

```bash
# Backend
cd ai-commerce-os/backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
npx prisma db push
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd ai-commerce-os/frontend
npm install
npm run dev
```

Copy `backend/.env.example` → `backend/.env` and
`frontend/.env.local.example` → `frontend/.env.local`, then fill in the
real keys from Phase 1. Also generate a session secret — the server
refuses to issue login tokens without it:

```bash
openssl rand -hex 32   # paste the output into JWT_SECRET in backend/.env
```

Then visit `http://localhost:3000/signup` to create your account before
anything else — every other page (dashboard, agents, billing) requires
being logged in.

## Ship it (Part 30)

```bash
cd ai-commerce-os
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-commerce-os.git
git push -u origin main
```

(Already tracked inside this repo — no separate remote needed unless you
want to split it out.)

## How the self-learning loop compounds (Part 33)

```
Day 1-7:   AI makes decisions based on general knowledge
    ↓
Day 8-30:  PatternAnalyzer identifies what works in YOUR niche
    ↓
Day 30+:   Scout retrieves learnings before every decision
    ↓
Day 60+:   Conversion rates improve 15-30% monthly
    ↓
Day 90+:   System is niche-specific expert
```

## What you have now (Part 35)

- ✅ All 8 account setup instructions
- ✅ Software install steps
- ✅ Full project structure
- ✅ 11 backend files (schema, deps, env, db, vector memory, API, scout
  agent, learner worker, billing, Shopify webhook, Dockerfile)
- ✅ 10 frontend files (config × 6, global styles, layout, API client,
  3 pages)
- ✅ Self-learning system (pattern analysis → vector memory → agent recall)
- ✅ Local run + deploy instructions
- ✅ Launch playbook (`MARKETING.md`)

**Not in this repo yet, because no email in the sequence covered it:**
cloud deployment configs (Vercel/Railway/etc.), the `arq` background worker
process that would actually schedule the learner on a cadence, Shopify
store-provisioning code (the guide only lists the manual signup step), and
the `frontend/app/billing`, `frontend/components/agents`, and
`backend/integrations` folders the structure command created but never
filled. Those are the natural next parts to write.
