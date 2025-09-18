import { test, expect } from '@playwright/test';
import fs from 'node:fs';


const INVENTORY_URL = '/inventory';

 test.describe('Inventory Page – Core flows', () => {
  test('Add items, HUD updates, budget gauge colors, preview highlight toggle', async ({ page }) => {
    await page.goto(INVENTORY_URL);

    // Title present
    await expect(page.getByTestId('context-builder-title')).toHaveText('Context Builder');

    // Add a snippet and a note
    await page.getByTestId('add-snippet').click();
    await page.getByTestId('add-note').click();

    // Fill contents to yield deterministic token counts: 8 chars => 2 tokens, 4 chars => 1 token
    await page.getByTestId('item-content-0').fill('aaaaaaaa'); // 8 chars
    await page.getByTestId('item-content-1').fill('bbbb'); // 4 chars

    // Token total should be 3
    await expect(page.getByTestId('token-total')).toHaveText(/\b3 tokens\b/);

    // Estimated cost: set price per 1K tokens high enough to observe non-zero cost
    const priceInput = page.getByTestId('inventory-price-input');
    await priceInput.fill('10');
    await expect(page.getByTestId('inventory-estimated-cost')).toHaveText('$0.0300');

    // Budget gauge over budget -> red and 100%
    const budgetInput = page.getByTestId('budget-input');
    await budgetInput.fill('2');
    const gaugeInner = page.getByTestId('budget-gauge-inner');
    // aria-valuenow is on the outer progress bar, verify it equals min(total, budget) => 2
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    await expect(gaugeInner).toHaveAttribute('style', /width:\s*100%/);
    await expect(gaugeInner).toHaveAttribute('style', /rgb\(239,\s*68,\s*68\)/); // red when over budget

    // Under budget -> green and ~3%
    await budgetInput.fill('100');
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
    await expect(gaugeInner).toHaveAttribute('style', /width:\s*3%/);
    await expect(gaugeInner).toHaveAttribute('style', /rgb\(34,\s*197,\s*94\)/); // green when within budget

    // Preview highlight toggle (XML only)
    await page.getByTestId('export-format').selectOption('xml');
    const preview = page.getByTestId('inventory-preview-output');

    // When highlight is off, the <pre> textContent should contain literal '<context'
    await expect(preview).toContainText('<context');

    // Turn highlight on
    await page.getByTestId('preview-highlight-toggle').check();
    // Now innerHTML should include span wrappers (syntax-colored)
    const inner = await preview.innerHTML();
    expect(inner).toContain('<span');
  });
});

 test.describe('Inventory Page – Presets lifecycle', () => {
  test('Save, list, load, export, delete presets; import from JSON', async ({ page }, testInfo) => {
    await page.goto(INVENTORY_URL);

    // Start with one snippet
    await page.getByTestId('add-snippet').click();
    await page.getByTestId('item-content-0').fill('abcd'); // 1 token

    // Save preset
    const presetName = 'My Test Preset';
    await page.getByTestId('preset-name-input').fill(presetName);
    await page.getByTestId('preset-save-btn').click();

    const slug = 'my-test-preset';
    const item = page.getByTestId(`preset-item-${slug}`);
    await expect(item).toBeVisible();

    // Load preset (idempotent sanity check)
    await page.getByTestId(`preset-load-${slug}`).click();

    // Export preset (verify download suggested filename contains slug and .json)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId(`preset-export-${slug}`).click(),
    ]);
    const suggested = download.suggestedFilename();
    expect(suggested).toMatch(/pigeon-context-my-test-preset-\d{8}-\d{6}\.json$/);

    // Delete preset (should remove from list)
    await page.getByTestId(`preset-delete-${slug}`).click();
    await expect(item).toHaveCount(0);

    // Import preset via hidden file input
    const importData = {
      meta: { name: 'Imported One' },
      data: {
        items: [
          { id: '', t: 'note', name: 'Note', content: 'zzzzzzzz', included: true, tokens: 0 }, // 8 chars => 2 tokens
        ],
        budget: 5,
        fmt: 'xml',
        pricePerK: '1.5',
      },
    };
    const json = JSON.stringify(importData, null, 2);
    const filePath = testInfo.outputPath('imported-preset.json');
    fs.writeFileSync(filePath, json, 'utf-8');

    // Trigger import by setting files on the hidden input
    const importInput = page.getByTestId('preset-import-input');
    await importInput.setInputFiles(filePath);

    const importedSlug = 'imported-one';
    await expect(page.getByTestId(`preset-item-${importedSlug}`)).toBeVisible();

    // Load imported preset and validate token total (2 tokens)
    await page.getByTestId(`preset-load-${importedSlug}`).click();
    await expect(page.getByTestId('token-total')).toHaveText(/\b2 tokens\b/);
  });
});