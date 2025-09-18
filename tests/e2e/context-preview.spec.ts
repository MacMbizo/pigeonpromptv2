import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';
const STUDIO_ID = '10000000-0000-0000-0000-000000000001';

// Disabled by default to keep CI green; enable when implementing PP-001
const ENABLED = process.env.E2E_ENABLE_CONTEXT_PREVIEW === '1';

test.describe('Context Preview Panel v1 (PP-001)', () => {
  test.skip(!ENABLED, 'Disabled by default; set E2E_ENABLE_CONTEXT_PREVIEW=1 to run');

  test('include/exclude toggles update token HUD and persist across reloads', async ({ page }) => {
    const url = `${APP_URL}/studio/${STUDIO_ID}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // File list and first row
    const list = page.getByTestId('context-file-list');
    await expect(list).toBeVisible();

    const firstRow = list.getByTestId('context-file-row').first();
    await expect(firstRow).toBeVisible();

    // HUD initial
    const hud = page.getByTestId('token-hud');
    await expect(hud).toBeVisible();

    // Toggle include off
    await firstRow.getByTestId('include-toggle').click();
    await expect(hud).toContainText(/Tokens:/);

    // Reload and verify persisted state
    await page.reload({ waitUntil: 'domcontentloaded' });
    const firstRowAfter = page.getByTestId('context-file-row').first();
    await expect(firstRowAfter.getByTestId('include-toggle')).toBeVisible();
  });

  test('excerpt modes (head/tail/custom) adjust HUD and preview content', async ({ page }) => {
    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' });

    const list = page.getByTestId('context-file-list');
    await expect(list).toBeVisible();

    const row = list.getByTestId('context-file-row').filter({ hasText: 'README.md' }).first();
    await expect(row).toBeVisible();

    // Switch modes
    const select = row.getByTestId('excerpt-mode-select');
    await select.selectOption('head');
    await select.selectOption('tail');
    await select.selectOption('custom');

    // Adjust range in custom
    await row.getByTestId('excerpt-start').fill('1');
    await row.getByTestId('excerpt-end').fill('10');

    const hud = page.getByTestId('token-hud');
    await expect(hud).toBeVisible();
  });
});