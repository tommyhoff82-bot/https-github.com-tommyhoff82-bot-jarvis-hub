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

## Actually verified, not just imported

Everything above this point had only been checked statically — `py_compile`,
JSON parsing, a synthetic import test. None of that proves the app *runs*.
It was then actually installed and booted for real: `pip install -r
requirements.txt`, a real local Postgres 16, `prisma db push`, `uvicorn
main:app`, and `npm install && npm run build` on the frontend. That surfaced
five real bugs, all now fixed:

1. **`requirements.txt` was uninstallable.** `arq==0.26.0` requires
   `redis<5`, but the very next line pins `redis==5.0.3` — a hard conflict,
   straight from the original email. Bumped to `arq==0.26.3` (same minor
   version; PyPI patch release relaxed the constraint to `redis<6`).
2. **`email-validator==2.1.0`** (a version I'd pinned for the auth work) is
   yanked from PyPI. Bumped to `2.1.1`.
3. **`schema.prisma` had a second broken relation** beyond the one already
   fixed: `Learning.decisions AIDecision[]` pointed at `AIDecision` with no
   matching field on the other side — `prisma generate` refused to run.
   Fixed by turning `AIDecision.learningId` from a bare string into a real
   `@relation` back to `Learning`.
4. **`agents/scout.py`, `workers/learner.py`, and `vector_db.py` all
   constructed their OpenAI/Pinecone clients at *module import time***,
   straight from the original emails. That meant importing any of them —
   even down a code path that never calls the LLM at all, like the
   learner's "fewer than 10 decisions, do nothing" early return — crashed
   with `You haven't specified an Api-Key` if those keys weren't set yet.
   All three now build their clients lazily, on first actual use.
5. Also found and removed a bug I'd introduced myself: a leftover
   `await db.disconnect()` at the end of `analyze_patterns` that would
   have killed the whole app's shared database connection the first time
   the learner actually found ≥10 decisions to analyze.
6. **`next@14.1.0` (pinned in the original email) has a disclosed critical
   vulnerability** (SSRF in Server Actions, cache poisoning, and others —
   `npm audit`). Bumped to `14.2.35`, which clears the critical finding.
   A handful of high-severity findings remain that only fully clear with a
   major-version jump to Next 16 — a breaking change (different APIs) out
   of scope for this pass; worth doing deliberately later, not as a side
   effect of a dependency bump.

With those fixes, this was confirmed working end-to-end against a real
database: signup, login, duplicate-email rejection, wrong-password
rejection, workspace creation actually persisting, the learner agent
completing cleanly with zero decisions, the Scout agent failing *inside
its real Pinecone call* (not at import) when no key is configured, bad
Shopify/Printify credentials rejected with 400s instead of 500s, billing
checkout correctly refusing with 503 when Stripe isn't configured, and
cross-user workspace access correctly rejected with 403. The frontend
type-checks clean (`tsc --noEmit`) and produces a real production build
(`npm run build`, all 9 routes render).

**What this still doesn't prove:** the OpenAI/Pinecone/Shopify/Printify/
Stripe integration code paths themselves — nothing here exercised a real
external API key, so Scout's actual product research, Printify order
submission, and Stripe Checkout redirects are still unverified beyond
"fails the way it should when unconfigured."

## Then verified again, in an actual browser

Passing curl checks against the API isn't the same as the app working —
nothing had actually clicked through the React frontend yet. So: booted
both servers for real (`uvicorn` + `next dev`) and drove a real headless
Chromium through the entire user journey with Playwright — landing page →
signup → onboarding (both steps) → dashboard → trigger the Learner agent
from the UI and watch it complete → billing → integrations → sign out →
confirm `RequireAuth` actually blocks the dashboard once logged out. All
13 checks passed, backed by real network calls to the real backend, not
mocks. That pass caught two more real bugs:

1. **`passlib` doesn't actually work with any current `bcrypt` release.**
   The earlier fix pinned `bcrypt==4.0.1` to work around passlib's
   internal self-test crashing — that held up in isolated testing, but
   failed the same way in a full server run (`bcrypt` has no `__about__`
   submodule in the installed wheel passlib expects). This isn't a
   version-pin problem to keep chasing: passlib hasn't shipped a release
   since 2020 and this whole compatibility class is unfixed upstream
   (github.com/pyca/bcrypt/issues/684). Removed passlib entirely —
   `auth.py` now calls `bcrypt.hashpw`/`bcrypt.checkpw` directly, which is
   the fix the wider FastAPI community has converged on for this exact
   problem. Also means the app now correctly rejects (400, not a crash)
   a password over bcrypt's real 72-byte limit, which passlib's version
   never actually enforced correctly at the API boundary either.
2. **The default browser favicon request 404'd.** `public/logo.svg`
   existed, but nothing served the `/favicon.ico` every browser requests
   automatically. Fixed properly via Next.js's own convention —
   `app/icon.svg` — which gets auto-served and auto-injected into
   `<head>` with no manual `<link>` tag needed.

With both fixed, the full click-through produced **zero console or page
errors** across the entire flow. This is the strongest verification this
project has had: not "it imports," not "curl gets a 200," but an actual
user journey, in an actual browser, against actual running servers,
observed to work.

## Automated tests

Everything above was a one-off manual pass — real, but it vanishes the
moment the terminal closes. It's now backed by a committed, repeatable
test suite so the next change gets checked automatically instead of by
hand:

- **`backend/tests/`** (pytest): `test_auth_unit.py` covers password
  hashing and JWT tokens with no database needed.
  `test_api_integration.py` hits the real FastAPI app through a real
  Postgres database — signup/login/duplicate-email/wrong-password,
  workspace creation actually persisting, cross-user workspace access
  correctly rejected, the learner completing cleanly with zero decisions,
  billing/integrations failure paths returning clean 4xx/5xx instead of
  crashing. Skipped automatically (not failed) if `TEST_DATABASE_URL`
  isn't set — see `backend/tests/conftest.py` for setup. Run with:
  ```bash
  pip install -r requirements.txt -r requirements-dev.txt
  export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/ai_commerce_os_test"
  export JWT_SECRET="test-secret"
  prisma db push   # with DATABASE_URL set to the same test database
  pytest tests/
  ```
- **`frontend/e2e/`** (Playwright): the committed version of the browser
  click-through above — same journey, same zero-console-errors
  assertion, runnable on demand instead of by hand. See
  `frontend/e2e/README.md` for setup (needs both servers running against
  a disposable test database). Run with `npm run test:e2e`.

Both suites are written to catch exactly the class of bug this whole
verification effort found — a broken dependency pin, a crash on import, a
missing static asset — not just "does the code parse."

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

This does *not* use Shopify OAuth — you paste in a custom app's Admin API
access token instead, which is simpler for a self-hosted template (no
redirect flow to build/host) but means each workspace owner has to create
that custom app themselves in their own Shopify admin.

**Webhook routing is now fixed.** The order webhook
(`api/webhooks/shopify.py`) used to fulfill every order through one global
`PRINTIFY_SHOP_ID`/`PRINTIFY_API_KEY` regardless of which store it came
from. It now reads the `X-Shopify-Shop-Domain` header, looks up which
workspace has that domain connected (`Integration` table, `platform ==
"shopify"`), then fulfills through *that* workspace's own connected
Printify account — not a global one. If a webhook arrives for a domain no
workspace has connected, or the matching workspace hasn't connected
Printify yet, it now fails loudly (404 / 422) instead of silently
fulfilling through the wrong account.

One real limitation this doesn't fix: `SHOPIFY_WEBHOOK_SECRET` is still
one deployment-wide value, because Shopify issues a webhook secret per
*app*, not per *store* — every store's order webhooks on this deployment
are verified against the same secret. Fine as long as one custom app
handles every connected store; a genuinely separate secret per store
would mean generating/storing one per `Integration` row and looking it up
by shop domain the same way the routing fix above does.

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
| `frontend/app/icon.svg` | Favicon (Next.js's auto-served convention) — the browser's automatic `/favicon.ico` request 404'd without it |
| `backend/tests/` | pytest suite — see "Automated tests" below |
| `frontend/e2e/` | Playwright suite — see "Automated tests" below |

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
