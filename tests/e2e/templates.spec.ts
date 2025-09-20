import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

test('templates page renders system templates', async ({ page, browserName }) => {
  // Gate WebKit in CI behind E2E_ENABLE_WEBKIT_CI=1; allow locally
  if (browserName === 'webkit') {
    if (process.env.CI && process.env.E2E_ENABLE_WEBKIT_CI !== '1') {
      test.skip(true, 'Skip on WebKit in CI until stabilized. Set E2E_ENABLE_WEBKIT_CI=1 to enable.');
    }
  }

  const url = `${APP_URL}/templates`;
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
  expect(resp?.ok(), 'templates page should respond').toBeTruthy();

  await expect(page.getByTestId('templates-page')).toBeVisible();
  const firstCard = page.locator('[data-testid="template-card"]').first();
  await expect(firstCard).toBeVisible();
});