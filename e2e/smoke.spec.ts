import { expect, test } from '@playwright/test';

/**
 * Phase 0 smoke coverage: proves the react-router migration actually serves every
 * route, including on a hard refresh (which is what the vercel.json SPA rewrite
 * has to handle in production).
 */

test('landing page renders the invite headline', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /RSVP NOW/i })).toBeVisible();
});

test('RSVP call to action scrolls to the form section', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /RSVP NOW/i }).click();
  await expect(page.locator('#rsvp')).toBeInViewport();
});

test('name gate appears before the RSVP form', async ({ page }) => {
  await page.goto('/');
  const gate = page.getByRole('button', { name: /CONTINUE/i });
  await expect(gate).toBeVisible();
});

test.describe('admin routes are gated', () => {
  // The route guard is UX, not the security boundary — RLS is, and it holds
  // regardless of what the browser renders. What these assert is that a signed
  // out visitor lands on the login form rather than an admin shell whose every
  // query silently returns nothing.
  const adminPaths = ['/admin', '/admin/guests', '/admin/checkin', '/admin/export'];

  for (const path of adminPaths) {
    test(`${path} redirects a signed-out visitor to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/, { timeout: 15_000 });
      await expect(page.getByRole('heading', { name: /Admin Console Sign In/i })).toBeVisible();
    });
  }

  test('the login form asks for an email and a password, both empty', async ({ page }) => {
    await page.goto('/admin/login');
    // The AI Studio stub shipped with credentials prefilled and accepted any
    // input. Both fields must start blank.
    await expect(page.locator('#adminEmail')).toHaveValue('');
    await expect(page.locator('#adminPassword')).toHaveValue('');
  });
});

test('the RSVP edit page rejects a missing token without a dead end', async ({ page }) => {
  await page.goto('/rsvp/edit');
  await expect(page.getByRole('heading', { name: /This link isn't working/i })).toBeVisible({
    timeout: 15_000,
  });
  // Never a dead end: there is always a way to reach a human.
  await expect(page.getByRole('link')).toHaveAttribute('href', /wa\.me/);
});

test('guest bundle does not pull in the admin chunk', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', (res) => {
    const url = res.url();
    if (url.endsWith('.js')) scripts.push(url);
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(scripts.some((s) => s.includes('OverviewDashboard'))).toBe(false);
  // data-access carries the full supabase-js client (~58 KB gzipped). The guest
  // path talks to the Edge Function with plain fetch via lib/supabase-config,
  // so this chunk must never reach the invite page.
  expect(scripts.some((s) => s.includes('data-access'))).toBe(false);
});
