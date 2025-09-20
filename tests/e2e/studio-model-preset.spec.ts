import { test, expect } from '@playwright/test';
import { STUDIO_ID, gotoStudio } from './helpers';

async function collectConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      !msg.text().includes('ResizeObserver loop') &&
      !msg.text().includes('Attempting to load font') &&
      !msg.text().includes('status of 422') &&
      !msg.text().includes('Unprocessable Entity')
    ) {
      errors.push(msg.text());
    }
  });
  return errors;
}

// Stability & isolation guards
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });
  page.on('dialog', d => d.dismiss().catch(() => { /* noop */ }));
  await page.addInitScript(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* noop */ }
  });
});

// Verifies: preset selection autofills price and (with checkbox enabled) adds a chip to targets
test('Model preset autofills price and adds to targets when enabled', async ({ page }) => {
  const consoleErrors = await collectConsoleErrors(page);
  await gotoStudio(page, STUDIO_ID);
  await expect(page.locator('#modelPresetSelect')).toBeVisible();

  const price = page.locator('#pricePerK');
  const preset = page.locator('#modelPresetSelect');
  const addToTargets = page.locator('#addPresetToTargets');

  // Initial state
  await expect(addToTargets).toBeChecked();
  await expect(price).toHaveValue('');

  // Select GPT-4o -> autofill price and add chip
  await preset.selectOption('gpt-4o');

  await expect(price).toHaveValue('0.01');
  await expect(page.getByRole('button', { name: 'Remove gpt-4o', exact: true })).toBeVisible();

  // Cleanup chip to keep subsequent tests isolated
  await page.getByRole('button', { name: 'Remove gpt-4o', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove gpt-4o', exact: true })).toHaveCount(0);

  // Ensure no console errors
  expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
});

// Verifies: when checkbox is disabled, preset selection still autofills price but does not add chip
test('Model preset autofills price without adding to targets when disabled', async ({ page }) => {
  const consoleErrors = await collectConsoleErrors(page);
  await gotoStudio(page, STUDIO_ID);
  await expect(page.locator('#modelPresetSelect')).toBeVisible();

  const price = page.locator('#pricePerK');
  const preset = page.locator('#modelPresetSelect');
  const addToTargets = page.locator('#addPresetToTargets');

  // Disable add-to-targets
  await addToTargets.uncheck();
  await expect(addToTargets).not.toBeChecked();

  // Select Claude Sonnet -> price only, no chip
  await preset.selectOption('claude-3.5-sonnet');

  await expect(price).toHaveValue('0.015');
  await expect(page.getByRole('button', { name: 'Remove claude-3.5-sonnet', exact: true })).toHaveCount(0);

  expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
});