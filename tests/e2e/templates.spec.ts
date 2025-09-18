import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

test('templates page renders system templates', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Skipping on webkit until headless install is stable in CI');
  const url = `${APP_URL}/templates`;
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
  expect(resp?.ok(), 'templates page should respond').toBeTruthy();

  await expect(page.getByTestId('templates-page')).toBeVisible();
  const firstCard = page.locator('[data-testid="template-card"]').first();
  await expect(firstCard).toBeVisible();
});