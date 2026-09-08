# Deploying AI Commerce OS

Three services, three accounts you control — I can't create Vercel or
Railway accounts on your behalf, and you shouldn't hand real API keys to
anything that isn't the actual hosting dashboard. This is the exact
runbook to get from "code on GitHub" to "a real URL."

## 1. Database — Supabase (done)

A dedicated project already exists for this:

- **Project:** `ai-commerce-os`
- **Ref:** `dipssvevvqonxahoqoyq`
- **URL:** https://dipssvevvqonxahoqoyq.supabase.co
- **Region:** us-east-1
- **Cost:** $0/month (free tier)

Your two other Supabase projects (`tommyhoff82`, `jarvis-brain`) were left
untouched.

**Get the connection string** (I can't retrieve this — Supabase only
shows the database password through the dashboard, by design):

1. Open https://supabase.com/dashboard/project/dipssvevvqonxahoqoyq/settings/database
2. Under "Connection string" → "URI", copy it. It looks like:
   `postgresql://postgres.dipssvevvqonxahoqoyq:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
3. Save this — it's your real `DATABASE_URL`, needed in step 2.

The schema itself isn't pushed yet. `backend/railway.json` runs
`prisma db push` automatically on every deploy, so it happens for real
the first time Railway boots — no separate manual step.

## 2. Backend — Railway

1. Go to https://railway.app, sign up/log in (GitHub login is easiest).
2. **New Project → Deploy from GitHub repo** → select
   `tommyhoff82-bot/https-github.com-tommyhoff82-bot-jarvis-hub`, branch
   `claude/business-automation-os-hssmny`.
3. Railway will ask for a **Root Directory** — set it to `ai-commerce-os/backend`.
   (It auto-detects Python via Nixpacks and reads `railway.json` for the
   start command — `prisma generate && prisma db push && uvicorn ...`.)
4. Under **Variables**, add every key from `backend/.env.example`, with
   real values:
   - `DATABASE_URL` — the Supabase connection string from step 1
   - `JWT_SECRET` — generate with `openssl rand -hex 32`
   - `FRONTEND_URL` — leave as `http://localhost:3000` for now; you'll
     update this after step 3 gives you the real Vercel URL
   - `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT` — from
     your own OpenAI/Pinecone accounts (Phase 1 of `MASTER_GUIDE.md`).
     Without these, everything works except the Scout and Learner agents.
   - `SHOPIFY_WEBHOOK_SECRET`, `PRINTIFY_API_KEY`, `STRIPE_SECRET_KEY`,
     `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — only needed once
     you're actually connecting a store / selling subscriptions; the app
     runs fine without them, those specific features just won't work yet.
   - Railway sets `PORT` itself — don't add it manually.
5. Deploy. Once it's live, Railway gives you a public URL like
   `https://ai-commerce-os-backend-production.up.railway.app` — **copy it**,
   you need it in step 3.
6. Sanity check: `curl https://<your-railway-url>/` should return
   `{"status":"online","version":"2.0.0"}`.

## 3. Frontend — Vercel

1. Go to https://vercel.com, sign up/log in (GitHub login is easiest).
2. **Add New → Project** → import the same GitHub repo.
3. Vercel will ask for a **Root Directory** — set it to `ai-commerce-os/frontend`.
   It auto-detects Next.js; no other config needed.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = the Railway URL from step 2, e.g.
     `https://ai-commerce-os-backend-production.up.railway.app`
5. Deploy. Vercel gives you a URL like
   `https://ai-commerce-os-yourname.vercel.app` — **this is the real,
   public link** to the app.

## 4. Close the loop

Go back to Railway and update the `FRONTEND_URL` variable to the real
Vercel URL from step 3, then redeploy the backend (Railway usually does
this automatically on a variable change). This matters — the backend's
CORS policy only allows requests from whatever `FRONTEND_URL` is set to;
until this is updated, the deployed frontend can reach the deployed
backend for `GET /` but every actual API call (signup, login, everything)
will be blocked by the browser as a CORS violation.

## After that

Visit the Vercel URL, sign up, and you have a real, live account. From
there:

- `/settings/integrations` — connect a real Shopify store / Printify
  account whenever you have them
- `/billing` — needs the `STRIPE_PRICE_*` variables set (see
  `backend/.env.example`) before checkout will work
- Scout and the Learner agent need `OPENAI_API_KEY` and
  `PINECONE_API_KEY` — see `MASTER_GUIDE.md` for what happens without them
  (a clean, caught failure, not a crash)

See `MASTER_GUIDE.md` for what's verified to actually work, and what
isn't yet.
