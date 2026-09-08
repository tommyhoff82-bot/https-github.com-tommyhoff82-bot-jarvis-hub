# End-to-end tests

This is the committed, repeatable version of the manual browser
verification pass documented in `MASTER_GUIDE.md` — run it after any
frontend or backend change instead of re-doing that by hand.

## Setup (once)

```bash
cd frontend
npm install
npx playwright install chromium   # downloads the matching browser build
```

## Running

Both servers need to be up first, pointed at a real, **disposable** test
database (never run this against production data — every test signs up a
real account and creates a real workspace):

```bash
# Terminal 1 — backend, against a throwaway database
cd backend
export DATABASE_URL="postgresql://user:pass@localhost:5432/ai_commerce_os_test"
export JWT_SECRET="test-secret"
prisma db push
uvicorn main:app --port 8000

# Terminal 2 — frontend
cd frontend
export NEXT_PUBLIC_API_URL="http://localhost:8000"
npm run dev

# Terminal 3 — the tests themselves
cd frontend
npm run test:e2e
```

Point at a different frontend origin with `E2E_BASE_URL` if you're not
using the default `http://localhost:3000` (e.g. testing a `next start`
production build on a different port).

## What's covered, and what isn't

`user-journey.spec.ts` drives a real signup through the full flow —
landing → signup → onboarding → dashboard → triggering the Learner agent
from the UI and watching it actually complete → billing → integrations →
sign out → confirming the auth guard blocks the dashboard afterward — plus
duplicate-email and wrong-password rejection. It asserts **zero console or
page errors** across the whole run, which is what caught the missing
favicon in the first place.

It does **not** cover Scout (needs a real OpenAI + Pinecone key to
succeed — see `MASTER_GUIDE.md`), any real Shopify/Printify/Stripe API
call, or anything requiring a paid external service. Those are the
honest limits of what an automated test can verify without live
credentials.
