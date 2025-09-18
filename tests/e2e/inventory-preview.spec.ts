import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

// E2E: Inventory Preview Panel
// Validates: panel renders, excerpt modes (head/tail) work, and format switch (text <-> xml) updates preview.
test.describe('Inventory Preview Panel', () => {
  test('render + excerpt modes + format switch', async ({ page }) => {
    // Seed one snippet item with multiline content via addInitScript BEFORE navigation to avoid effect races
    const content = ['line1','line2','line3','line4','line5','line6'].join('\n');
    await page.addInitScript((text) => {
      const item = { id: 'e2e-seed-1', t: 'snippet', name: 'Snippet', content: text, included: true, tokens: 0 };
      try {
        localStorage.setItem('ctx.items', JSON.stringify([item]));
      } catch (e) { void e; }
    }, content);

    const url = `${APP_URL}/inventory`;
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(resp?.ok(), 'inventory page should respond').toBeTruthy();

    // Assert page shell is present
    await expect(page.getByTestId('context-builder-title')).toBeVisible();

    // Validate seeded storage exists in this origin after navigation
    const raw = await page.evaluate(() => localStorage.getItem('ctx.items'));
    expect(raw, 'ctx.items should be present in localStorage after navigation').toBeTruthy();

    // Ensure Preview panel and output are present
    const previewPanel = page.getByTestId('inventory-preview-panel');
    await expect(previewPanel).toBeVisible();
    const previewOutput = page.getByTestId('inventory-preview-output');

    // Wait briefly for hydration; if items list doesn't render, fall back to UI interactions
    const list = page.getByTestId('items-list');
    const rows = list.getByTestId('item-row');
    let hadHydrated = true;
    try {
      await expect(rows).toHaveCount(1, { timeout: 3000 });
    } catch (e) {
      void e;
      hadHydrated = false;
    }

    if (!hadHydrated) {
      // Fallback: add via UI to ensure state is populated
      await page.getByTestId('add-snippet').click();
      const ta = page.getByTestId('item-content-0');
      await ta.fill(content);
      // Now we should have exactly 1 row
      await expect(rows).toHaveCount(1);
    }

    // Wait until preview has some text content (hydration + assembleContext completed)
    await expect(previewOutput).toContainText('line1', { timeout: 10000 });

    // Default (full) should show at least an early and late line
    await expect(previewOutput).toContainText('line1');
    await expect(previewOutput).toContainText('line6');

    // Head excerpt: keep first few lines, hide tail
    await page.getByTestId('preview-mode').selectOption('head');
    const linesInput = page.getByTestId('preview-lines-input');
    await linesInput.fill('3');
    await expect(previewOutput).toContainText('line1');
    await expect(previewOutput).not.toContainText('line6');
    await expect(previewOutput).toContainText('more lines'); // truncation indicator

    // Tail excerpt: keep last few lines, hide head
    await page.getByTestId('preview-mode').selectOption('tail');
    await linesInput.fill('2');
    await expect(previewOutput).toContainText('line6');
    await expect(previewOutput).not.toContainText('line1');
    await expect(previewOutput).toContainText('lines above'); // truncation indicator

    // Reset excerpt to Full to assert XML tags from the start of document
    await page.getByTestId('preview-mode').selectOption('full');

    // Format switch: XML should render <context> and <item>
    const fmtSelect = page.getByTestId('export-format');
    await fmtSelect.selectOption('xml');
    await expect(previewOutput).toContainText('<context');
    await expect(previewOutput).toContainText('<item type="snippet"');

    // Switch back to text format, header marker should appear
    await fmtSelect.selectOption('text');
    await expect(previewOutput).toContainText('----');
  });
});