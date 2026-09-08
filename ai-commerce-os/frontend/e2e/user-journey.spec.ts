import { test, expect } from '@playwright/test';

// This is the committed version of the manual browser verification pass
// documented in MASTER_GUIDE.md ("Then verified again, in an actual
// browser") — run this after any frontend or backend change instead of
// re-doing that by hand. It drives a real signup through a fresh account
// every run (see e2e/README.md for why), so it needs the backend pointed
// at a real, disposable database — never run this against production.

function uniqueEmail() {
  return `e2e+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

const PASSWORD = 'supersecret123';

test.describe('AI Commerce OS — full user journey', () => {
  test('landing → signup → onboarding → dashboard → agents → billing → integrations → sign out', async ({ page }) => {
    const email = uniqueEmail();
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

    await test.step('landing page renders', async () => {
      await page.goto('/');
      await expect(page.getByText('Start Your AI Business')).toBeVisible();
    });

    await test.step('sign up creates a real account and redirects to onboarding', async () => {
      await page.getByRole('link', { name: 'Start Free Trial' }).click();
      await expect(page).toHaveURL(/\/signup$/);
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(PASSWORD);
      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/\/onboarding$/, { timeout: 10_000 });
    });

    await test.step('onboarding creates a real workspace and redirects to dashboard', async () => {
      await page.getByPlaceholder('Business Name').fill('E2E Test Co');
      await page.getByText('Next').click();
      await page.getByPlaceholder('Target Niche').fill('eco-friendly kitchenware');
      await page.getByText('Launch My AI Business').click();
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
      await expect(page.getByText('E2E Test Co')).toBeVisible();
    });

    await test.step('triggering the learner agent from the UI actually completes', async () => {
      await page.getByRole('link', { name: 'AI Agents' }).click();
      await expect(page).toHaveURL(/\/agents$/);
      // "Pattern Analyzer" is the second AgentCard (Scout is the first, and
      // needs a real OpenAI/Pinecone key to succeed — see MASTER_GUIDE.md).
      await page.getByRole('button', { name: 'Run Now' }).nth(1).click();
      await expect(page.getByText('learner', { exact: false })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('completed', { exact: false })).toBeVisible({ timeout: 15_000 });
    });

    await test.step('billing page renders live plans from the API', async () => {
      await page.goto('/billing');
      // Headings specifically — "Starter" also appears lowercase elsewhere
      // on this page as the workspace's current-tier label.
      await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible();
    });

    await test.step('integrations page renders connect forms', async () => {
      await page.goto('/settings/integrations');
      await expect(page.getByRole('heading', { name: 'Shopify' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Printify' })).toBeVisible();
    });

    await test.step('sign out redirects to login, and RequireAuth blocks the dashboard', async () => {
      await page.goto('/dashboard');
      await page.getByText('Sign out').click();
      await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });

      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });
    });

    expect(consoleErrors, `console/page errors during the run:\n${consoleErrors.join('\n')}`).toEqual([]);
  });

  test('signing up with a duplicate email fails visibly', async ({ page, request }) => {
    const email = uniqueEmail();
    await page.goto('/signup');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/onboarding$/, { timeout: 10_000 });

    // Second signup, same email, straight from a fresh page.
    await page.goto('/signup');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    // Should NOT navigate away — the form should show an error instead.
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test('logging in with the wrong password fails visibly', async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/signup');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/onboarding$/, { timeout: 10_000 });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill('wrong-password');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });
});
