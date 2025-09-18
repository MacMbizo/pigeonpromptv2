import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

// Fast smoke: seed ONE preset directly in localStorage, verify Export -> Delete -> Import brings it back.
// Keeps assertions minimal and resilient to reduce flake in CI.
test('Inventory presets: export/import smoke', async ({ page }) => {
  const now = new Date().toISOString();
  const name = `smoke preset ${Date.now()}`;
  const slug = `smoke-preset-${Date.now()}`;

  // Seed localStorage BEFORE page load so the app picks it up on first render
  await page.addInitScript(({ slug, name, now }) => {
    const meta = { name, slug, createdAt: now, updatedAt: now };
    const data = { items: [], budget: '', fmt: 'text' as const, pricePerK: '2.00' };
    localStorage.setItem('ctx.presets.index', JSON.stringify([meta]));
    localStorage.setItem(`ctx.preset.${slug}`, JSON.stringify({ meta, data }));
  }, { slug, name, now });

  // Navigate and wait for basic UI
  await page.goto(`${APP_URL}/inventory`);
  await expect(page.getByTestId('context-builder-title')).toHaveText('Context Builder');

  // Ensure the preset appears in the list
  const itemRow = page.getByTestId(`preset-item-${slug}`);
  await expect(itemRow).toBeVisible();

  // Export the preset and verify filename
  const exportBtn = page.getByTestId(`preset-export-${slug}`);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportBtn.click(),
  ]);
  const suggested = download.suggestedFilename();
  expect(suggested).toMatch(/^pigeon-context-.*\.json$/);

  // Delete the preset to verify the Import brings it back
  await page.getByTestId(`preset-delete-${slug}`).click();
  await expect(page.getByTestId(`preset-item-${slug}`)).toHaveCount(0);

  // Import the previously downloaded file
  const tempFilePath = await download.path();
  expect(tempFilePath).toBeTruthy();
  await page.getByTestId('preset-import-btn').click();
  await page.getByTestId('preset-import-input').setInputFiles(tempFilePath!);

  // The preset should re-appear
  await expect(page.getByTestId(`preset-item-${slug}`)).toBeVisible();
});