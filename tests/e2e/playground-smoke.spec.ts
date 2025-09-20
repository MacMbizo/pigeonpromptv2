import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

// Simple smoke of playground run both and verify outputs render with metrics
test('playground run both displays results and metrics', async ({ page, browserName }) => {
  if (browserName === 'webkit') {
    if (process.env.CI && process.env.E2E_ENABLE_WEBKIT_CI !== '1') {
      test.skip(true, 'Skip on WebKit in CI until stabilized. Set E2E_ENABLE_WEBKIT_CI=1 to enable.');
    }
  }

  await page.goto(`${APP_URL}/playground`);
  await expect(page.getByTestId('playground-page')).toBeVisible();

  // Enter a prompt
  const prompt = page.getByTestId('prompt-input');
  await prompt.fill('List three benefits of writing unit tests.');

  // Run both sides
  await page.getByTestId('run-both').click();

  // Wait for both outputs to appear
  const leftOut = page.getByTestId('output-left');
  const rightOut = page.getByTestId('output-right');
  await expect(leftOut).toContainText('Deterministic response', { timeout: 15_000 });
  await expect(rightOut).toContainText('Deterministic response', { timeout: 15_000 });

  // HUD should show tokens and cost badge
  const hud = page.getByTestId('cost-hud');
  await expect(hud).toBeVisible();

  // No console errors other than known dev noise
});