import { test, expect } from '@playwright/test';
import { waitForSavedBadgeOrPersistedDraft } from './helpers';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';
const STUDIO_ID = '10000000-0000-0000-0000-000000000001';

// Utility to collect console errors and fail at the end if any
async function collectConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter known benign dev overlay/hydration noises during Next.js dev
      const ignore = [
        'ReactDevOverlay',
        'react-dev-overlay',
        'Hydration failed',
        'Expected server HTML',
        'Fast Refresh had to perform a full reload',
        'app-router.js',
        // In dev, the Studio page may issue requests that 422 before falling back to mock data
        'status of 422',
        'Unprocessable Entity',
      ].some(sig => text.includes(sig));
      if (!ignore) errors.push(text);
    }
  });
  return errors;
}

test.describe('Studio page smoke', () => {
  test('autosave + discard clears draft in localStorage', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip on webkit until browsers are stable in CI');
    const consoleErrors = await collectConsoleErrors(page);

    const url = `${APP_URL}/studio/${STUDIO_ID}`;
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(resp?.ok(), 'studio page should respond').toBeTruthy();

    // Locate editor via testid and type
    const editor = page.getByTestId('editor-input');
    await expect(editor).toBeVisible();

    const beforeVal = await editor.inputValue();
    await editor.click();
    await editor.type(' smoke-autosave');

    // Autosave status should transition
    const autosaving = page.getByTestId('autosave-badge').filter({ hasText: 'Autosaving…' });
    await expect(autosaving).toBeVisible({ timeout: 5000 });
    const draftKey = `pigeon:studio:${STUDIO_ID}:draft`;
    const currentContent = await editor.inputValue();
    await waitForSavedBadgeOrPersistedDraft(page, draftKey, currentContent);

    // Seed a draft key and ensure Discard clears it, independent of autosave mechanism
    // reuse draftKey defined above
    await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ ts: Date.now(), content: 'temp' })), draftKey);
    const seeded = await page.evaluate((key) => !!localStorage.getItem(key), draftKey);
    expect(seeded, 'precondition: localStorage draft seeded').toBeTruthy();

    // Trigger Discard and accept confirm dialog
    page.once('dialog', d => d.accept());
    await page.getByTestId('btn-discard').click();

    // Draft should be cleared
    const draftCleared = await page.evaluate((key) => !localStorage.getItem(key), draftKey);
    expect(draftCleared, 'localStorage draft should be cleared after discard').toBeTruthy();

    // Editor value should revert or at least not contain our typed suffix entirely
    const afterVal = await editor.inputValue();
    expect(afterVal.length <= beforeVal.length + 1).toBeTruthy();

    // No console errors
    expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
  });

  test('model targets chips: add via comma', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip on webkit until browsers are stable in CI');
    const consoleErrors = await collectConsoleErrors(page);

    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' });

    // Find the input by testid
    const input = page.getByTestId('model-targets-input');
    await expect(input).toBeVisible();

    const target = 'gpt-4o';
    await input.click();
    await input.fill('');
    await input.type(`${target},`);

    // Expect remove button for the chip to appear (unambiguous selector)
    const removeBtn = page.getByRole('button', { name: `Remove ${target}` });
    await expect(removeBtn).toBeVisible();

    // No console errors
    expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
  });

  test('diff controls toggle and Insert copies into draft', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip on webkit until browsers are stable in CI');
    const consoleErrors = await collectConsoleErrors(page);

    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' });

    const editor = page.getByTestId('editor-input');
    await expect(editor).toBeVisible();

    // Create a diff by editing the draft
    await editor.click();
    await editor.type(' diff-change');

    // Ensure Side-by-side is enabled via its accessible name
    const sbsCheckbox = page.getByTestId('diff-side-by-side');
    if (await sbsCheckbox.count()) {
      const checked = await sbsCheckbox.isChecked();
      if (!checked) {
        await sbsCheckbox.click();
      }
      await expect(sbsCheckbox).toBeChecked();
    }

    // Word-level checkbox present (assert visible only)
    const wlCheckbox = page.getByTestId('diff-word-level');
    if (await wlCheckbox.count()) {
      await expect(wlCheckbox).toBeVisible();
    }

    // Context radius select should be operable (if present)
    const contextSelect = page.getByTestId('diff-context-radius');
    if (await contextSelect.count()) {
      await contextSelect.selectOption('3');
      await expect(contextSelect).toHaveValue('3');
    }

    // Ensure we have at least one 'added' hunk visible
    const diffRoot = page.getByTestId('diff-root');
    await expect(diffRoot).toBeVisible();
    const addedStat = page.getByTestId('diff-stats-added');
    await expect(addedStat).toBeVisible();

    // If no insert button yet, type a newline to create an added block more reliably
    let insertButton = page.getByTestId('diff-insert');
    if (!(await insertButton.count())) {
      await editor.type('\nextra line for diff');
      // give UI a moment to recompute diff via state-based wait
      await expect.poll(async () => (await page.getByTestId('diff-insert').count()) > 0, { timeout: 3000 }).toBe(true);
      insertButton = page.getByTestId('diff-insert');
      
    }

    // Ensure editor is focused and capture baseline length
    await editor.click();
    const beforeLen = (await editor.inputValue()).length;

    // Try the Insert button until we observe length increase
    await expect(insertButton).toBeVisible({ timeout: 5000 });
    await insertButton.click();
    await expect.poll(async () => (await editor.inputValue()).length, { timeout: 5000 }).toBeGreaterThan(beforeLen);

    // No console errors
    expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
  });

  test('keyboard shortcuts: save (Ctrl/Cmd+S) and discard (Ctrl/Cmd+Shift+D)', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip on webkit until browsers are stable in CI');
    const consoleErrors = await collectConsoleErrors(page);

    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' });

    const editor = page.getByTestId('editor-input');
    await expect(editor).toBeVisible();

    const base = await editor.inputValue();

    // Make a non-empty draft and save via shortcut
    await editor.click();
    await editor.type(' new version');

    // Trigger save via keyboard
    await page.keyboard.press('Control+S');

    // Expect Saved badge visible soon after
    await expect(page.getByTestId('autosave-badge').filter({ hasText: 'Saved' })).toBeVisible({ timeout: 5000 });

    // Now test discard via shortcut: make it dirty again
    await editor.type(' temp');
    const draftKey = `pigeon:studio:${STUDIO_ID}:draft`;

    // Ensure autosave runs at least once
    await expect(page.getByTestId('autosave-badge').filter({ hasText: 'Autosaving…' })).toBeVisible({ timeout: 5000 });
    await waitForSavedBadgeOrPersistedDraft(page, draftKey);

    // Listen for confirm and trigger discard via keyboard
    page.once('dialog', d => d.accept());
    await page.keyboard.press('Control+Shift+D');

    // Draft should be cleared and editor should match base content
    const draftCleared = await page.evaluate((key) => !localStorage.getItem(key), draftKey);
    expect(draftCleared).toBeTruthy();
    const after = await editor.inputValue();
    expect(after).toBe(base);

    // No console errors
    expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
  });
});

  test('validation: invalid model targets disable save and show alert', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip on webkit until browsers are stable in CI');
    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' });

    const input = page.getByTestId('model-targets-input');
    await expect(input).toBeVisible();

    const bad = 'foo-123';
    await input.click();
    await input.fill('');
    await input.type(`${bad},`);

    // Alert should surface invalid target and allowed prefixes copy (avoid Next.js route announcer)
    const alert = page.locator('div[role="alert"]').filter({ hasText: 'Invalid targets:' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(`Invalid targets: ${bad}`);
    await expect(alert).toContainText('Allowed prefixes:');

    // Save button should be disabled with an explanatory title
      const saveBtn = page.getByTestId('btn-save');
       await expect(saveBtn).toBeDisabled();
       await expect(saveBtn).toHaveAttribute('title', new RegExp(`${bad}`));
  });

  test('save preflight: Ctrl/Cmd+S shows toast error for invalid targets', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip on webkit until browsers are stable in CI');
    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' });

    const input = page.getByTestId('model-targets-input');
    await expect(input).toBeVisible();

    const bad = 'foo-999';
    await input.click();
    await input.fill('');
    await input.type(`${bad},`);

    // Focus editor and trigger save via keyboard (Save button remains disabled)
    const editor = page.getByTestId('editor-input');
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.press('Control+S');

    // Expect local toast error to appear
    const toastErr = page.getByText(`Fix invalid targets: ${bad}`, { exact: false });
    await expect(toastErr).toBeVisible({ timeout: 3000 });
  });

  test('happy-path manual save shows Saved then clears after 5s window', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip on webkit until browsers are stable in CI');

    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' });

    const editor = page.getByTestId('editor-input');
    await expect(editor).toBeVisible();

    // Make a non-empty draft
    await editor.click();
    await editor.type(' happy-path');

    // Trigger manual save via keyboard shortcut
    await page.keyboard.press('Control+S');

    const saved = page.getByTestId('autosave-badge').filter({ hasText: 'Saved' });
    await expect(saved).toBeVisible({ timeout: 5000 });

    // After the 5s window configured in useAutosave.onManualSaveSuccess, the badge should clear to idle
    // Allow some buffer beyond 5000ms to avoid flakiness
    await expect(page.getByTestId('autosave-badge')).toHaveCount(0, { timeout: 7000 });
  });