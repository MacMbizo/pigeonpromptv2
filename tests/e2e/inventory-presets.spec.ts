import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

// E2E: Inventory Presets Panel
// Covers: save, load, export, delete, import
// Note: relies on data-testid selectors implemented in Inventory page

test.describe('Inventory Presets Panel', () => {
  test('save, load, export, delete, import', async ({ page }) => {
    // Seed deterministic items and context in localStorage prior to navigation
    const seededItems = [
      { id: 'seed-1', t: 'snippet', name: 'Alpha', content: 'Line A1\nLine A2', included: true, tokens: 0 },
      { id: 'seed-2', t: 'snippet', name: 'Beta', content: 'Line B1\nLine B2\nLine B3', included: true, tokens: 0 },
    ];

    await page.addInitScript((items) => {
      try {
        localStorage.setItem('ctx.items', JSON.stringify(items));
        localStorage.setItem('ctx.budget', JSON.stringify(2500));
        // Store price as a plain string to match component behavior
        localStorage.setItem('ctx.pricePerK', '2.00');
        localStorage.setItem('ctx.fmt', 'text');
      } catch (e) { void e; }
    }, seededItems);

    const url = `${APP_URL}/inventory`;
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(resp?.ok(), 'inventory page should respond').toBeTruthy();

    // Verify base UI
    await expect(page.getByTestId('context-builder-title')).toBeVisible();

    // Best-effort: wait for hydration effect to restore price input from localStorage
    // This ensures React is hydrated and event listeners (e.g., Add Snippet) are attached before we interact
    try {
      await expect(page.getByTestId('inventory-price-input')).toHaveValue('2.00', { timeout: 3000 });
    } catch (e) { void e; }

    // Ensure items rendered (fallback to UI seeding if localStorage restore didn't populate)
    const rows = page.getByTestId('items-list').getByTestId('item-row');
    // Removed strict visibility assertion to allow fallback path when list is initially hidden
    let count = await rows.count();
    if (count === 0) {
      // Fallback: add two snippets via UI and wait for each to appear before filling content
      await page.getByTestId('add-snippet').click();
      await expect(rows).toHaveCount(1, { timeout: 10000 });
      await page.getByTestId('add-snippet').click();
      await expect(rows).toHaveCount(2, { timeout: 10000 });

      // Ensure textareas are attached and visible before filling
      const item0 = page.getByTestId('item-content-0');
      const item1 = page.getByTestId('item-content-1');
      await expect(item0).toBeVisible({ timeout: 10000 });
      await expect(item1).toBeVisible({ timeout: 10000 });

      await item0.fill('Line A1\nLine A2');
      await item1.fill('Line B1\nLine B2\nLine B3');

      // Also set budget and price to match assertions
      await page.getByTestId('budget-input').fill('2500');
      await page.getByTestId('inventory-price-input').fill('2.00');
    }

    await expect(rows).toHaveCount(2, { timeout: 10000 });

    // Set a unique preset name and save
    const presetName = `E2E Preset ${Date.now()}`;
    await page.getByTestId('preset-name-input').fill(presetName);
    await page.getByTestId('preset-save-btn').click();

    // Compute slug the same way as slugifyName in presets.ts
    const slug = presetName
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ß|ẞ/g, 'ss')
      .replace(/æ/g, 'ae')
      .replace(/œ/g, 'oe')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');

    const item = page.getByTestId(`preset-item-${slug}`);
    await expect(item).toBeVisible();

    // Load preset
    await page.getByTestId(`preset-load-${slug}`).click();

    // Verify loaded state (budget/price and rendered items)
    await expect(page.getByTestId('budget-input')).toHaveValue('2500');
    await expect(page.getByTestId('inventory-price-input')).toHaveValue('2.00');
    await expect(rows).toHaveCount(2);

    // Export preset and capture download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId(`preset-export-${slug}`).click(),
    ]);
    const suggested = await download.suggestedFilename();
    // Match the actual export filename format produced by buildExportFilename(name)
    // See src/lib/presets.ts -> buildExportFilename
    expect(suggested).toMatch(new RegExp(`^pigeon-context-${slug}-\\d{8}-\\d{6}\\.json$`));

    // Ensure we have a filesystem path for the downloaded file
    let filePath = await download.path();
    if (!filePath) {
      const target = path.join(process.cwd(), 'test-results', suggested);
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      await download.saveAs(target);
      filePath = target;
    }

    // Delete preset
    await page.getByTestId(`preset-delete-${slug}`).click();
    await expect(item).toHaveCount(0);

    // Re-import the previously exported JSON
    await page.getByTestId('preset-import-btn').click();
    await page.getByTestId('preset-import-input').setInputFiles(filePath!);

    // It should re-appear in the list
    await expect(page.getByTestId(`preset-item-${slug}`)).toBeVisible();
  });
});