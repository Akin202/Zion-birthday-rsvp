import { expect, test, type Page } from '@playwright/test';

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

test.describe('admin routes resolve on direct navigation', () => {
  // Match on page body content, not the nav — the desktop sidebar renders its
  // labels on mobile too, just hidden, so nav text would pass even if the route
  // failed to load.
  const cases = [
    { path: '/admin', locate: (p: Page) => p.getByText('Total Expected Headcount').first() },
    {
      path: '/admin/guests',
      locate: (p: Page) => p.getByPlaceholder('Search guest name, email, or phone...'),
    },
    { path: '/admin/checkin', locate: (p: Page) => p.getByText('Door Check-In Station').first() },
    { path: '/admin/export', locate: (p: Page) => p.getByText('Data Export Console').first() },
  ];

  for (const { path, locate } of cases) {
    test(`${path} loads its lazy chunk`, async ({ page }) => {
      await page.goto(path);
      await expect(locate(page)).toBeVisible({ timeout: 15_000 });
    });
  }
});

test('door check-in exposes an autofocused search input', async ({ page }) => {
  await page.goto('/admin/checkin');
  const search = page.getByPlaceholder('Search guest name...');
  await expect(search).toBeVisible();
  await expect(search).toBeFocused();
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
});
