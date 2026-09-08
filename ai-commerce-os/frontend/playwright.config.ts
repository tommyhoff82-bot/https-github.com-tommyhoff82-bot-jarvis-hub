import { defineConfig } from '@playwright/test';

// Assumes both servers are already running (see e2e/README.md):
//   backend:  uvicorn main:app --port 8000   (against a real, disposable test DB)
//   frontend: npm run dev                     (or npm run build && npm run start)
// This does NOT start them for you — a real Postgres + Prisma schema push
// aren't things Playwright's webServer option can set up on its own, and
// pretending otherwise would hide exactly the kind of setup step that
// bit this project earlier (see MASTER_GUIDE.md's "Actually verified"
// section).
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false, // tests share one signup flow's assumptions about a clean DB
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
