import { test, expect } from '@playwright/test';

// Smoke test for Context Builder basic interactions
// Prereq: Playwright config starts Next dev at baseURL

test.describe('Context Builder', () => {
  test('smoke: add snippet, edit content, budget HUD, export actions, cost HUD', async ({ page }) => {
    await page.goto('/inventory');

    await expect(page.getByTestId('context-builder-title')).toBeVisible();

    // Add a snippet
    await page.getByTestId('add-snippet').click();

    const list = page.getByTestId('items-list');
    await expect(list).toBeVisible();
    const rows = list.getByTestId('item-row');
    await expect(rows).toHaveCount(1);

    // Type 8 chars -> estimateTokens = ceil(8/4) = 2 tokens
    const textarea = page.getByTestId('item-content-0');
    await textarea.fill('abcdabcd');

    // Token total updates
    await expect(page.getByTestId('token-total')).toContainText('2 tokens');

    // Set budget to 10, gauge should be at 20%
    const budgetInput = page.getByTestId('budget-input');
    await budgetInput.fill('10');

    const gauge = page.getByTestId('budget-gauge-inner');
    await expect(gauge).toHaveAttribute('style', /width:\s*20%/);

    // Export controls exist and can be clicked
    const format = page.getByTestId('export-format');
    await format.selectOption('xml');

    await page.getByTestId('copy-btn').click();
    await page.getByTestId('download-btn').click();

    // Cost HUD: initially shows em dash
    await expect(page.getByTestId('inventory-estimated-cost')).toHaveText('—');

    // Enter $/1K = 0.005 -> cost = (2/1000)*0.005 = 0.00001 -> $0.0000 when fixed(4)
    const priceInput = page.getByTestId('inventory-price-input');
    await priceInput.fill('0.005');
    await expect(page.getByTestId('inventory-estimated-cost')).toHaveText('$0.0000');

    // Change content to 4000 chars: 4000/4=1000 tokens -> cost = (1000/1000)*0.005 = 0.005 -> $0.0050
    await textarea.fill('x'.repeat(4000));
    await expect(page.getByTestId('token-total')).toContainText('1000 tokens');
    await expect(page.getByTestId('inventory-estimated-cost')).toHaveText('$0.0050');

    // Use model preset dropdown to autofill price and compute cost again
    const preset = page.getByTestId('inventory-model-preset');
    await preset.selectOption('gpt-4o'); // pricePerK 5.0 (see modelPresets in page.tsx)
    await expect(page.getByTestId('inventory-estimated-cost')).toHaveText('$5.0000');
  });
});