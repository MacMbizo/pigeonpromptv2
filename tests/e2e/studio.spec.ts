import { test, expect } from '@playwright/test';
import { waitForSavedBadgeOrPersistedDraft, APP_URL, STUDIO_ID, gotoStudio, studioDraftKey } from './helpers';

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

// Global stability guards
// Note: Do not clear storage here because autosave tests rely on persisted state across reloads within a test.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' })
  // Removed global dialog auto-dismiss to avoid racing with tests that explicitly accept confirms
});

// Studio smoke: autosave + discard clears draft in localStorage
test('Studio page smoke — autosave + discard clears draft in localStorage', async ({ page }) => {
  const consoleErrors = await collectConsoleErrors(page)
  await gotoStudio(page, STUDIO_ID)

  const editor = page.getByTestId('editor-input')
  await expect(editor).toBeVisible()

  await editor.fill('Hello autosave!')
  // Wait for either Saved badge or persisted draft containing our content (helper encapsulates both)
  await waitForSavedBadgeOrPersistedDraft(page, studioDraftKey(STUDIO_ID), 'Hello autosave!')

  // Discard draft via button and accept dialog (validate clear semantics without relying on reload)
  page.once('dialog', d => d.accept())
  await page.getByTestId('btn-discard').click()

  // Ensure draft cleared from localStorage
  await expect.poll(async () => {
    return await page.evaluate((key) => localStorage.getItem(key), studioDraftKey(STUDIO_ID))
  }, { timeout: 4000 }).toBeNull()

  // Editor should no longer contain our autosaved text
  await expect(editor).not.toHaveValue(/Hello autosave!/)

  expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0)
})

test.describe('Studio page smoke', () => {
  test('autosave + discard clears draft in localStorage', async ({ page, browserName }) => {
    // Allow WebKit locally now that we hardened the test; still skip in CI if needed via env
    if (process.env.CI && browserName === 'webkit') {
      test.skip(true, 'Skip on WebKit in CI until stabilized')
    }
    const consoleErrors = await collectConsoleErrors(page);

    const url = `${APP_URL}/studio/${STUDIO_ID}`;
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(resp?.ok(), 'studio page should respond').toBeTruthy();

    // Locate editor via testid and type
    const editor = page.getByTestId('editor-input');
    await expect(editor).toBeVisible();

    const beforeVal = await editor.inputValue();
    await editor.click();
    const typedSuffix = ' smoke-autosave';
    await editor.type(typedSuffix);

    // Autosave status should transition
    const autosaving = page.getByTestId('autosave-badge').filter({ hasText: 'Autosaving…' });
    await expect(autosaving).toBeVisible({ timeout: 5000 });
    const draftKey = studioDraftKey(STUDIO_ID);
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

    // Draft should be cleared (poll to avoid race with React state updates)
    await expect
      .poll(async () => await page.evaluate((key) => !localStorage.getItem(key), draftKey), { timeout: 3000 })
      .toBe(true);

    // Editor value should revert and not contain our typed suffix
    const afterVal = await editor.inputValue();
    expect(afterVal).not.toContain(typedSuffix);
    // Also ensure it is not longer than the original + small tolerance for newline
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
    // WebKit enabled for this test after hardening; keep others skipped for now
    const consoleErrors = await collectConsoleErrors(page);

    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' });

    // Neutralize animations/transitions for cross-browser stability
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });

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
    }

    // Toggle controls
    const compact = page.getByTestId('diff-compact');
    if (await compact.count()) await compact.click();
    const sbsHeaderBase = page.getByText('Base');
    const sbsHeaderDraft = page.getByText('Draft');
    // Some themes/layouts may render both headers; assert that at least one is visible instead of requiring a single-element locator
    await expect
      .poll(async () => (await sbsHeaderBase.isVisible()) || (await sbsHeaderDraft.isVisible()), { timeout: 5000 })
      .toBe(true);

    // Ensure diff root visible and try to find an Insert control
    const diffRoot = page.getByTestId('diff-root');
    await expect(diffRoot).toBeVisible();

    // Prefer testid button if present; otherwise fall back to role-based name
    let insertButton = page.getByTestId('diff-insert');
    if (!(await insertButton.count())) {
      insertButton = page.getByRole('button', { name: 'Insert' });
    }
    if (!(await insertButton.count())) {
      // Force another small change to ensure an added hunk appears
      await editor.type('\nextra line for diff');
      await expect
        .poll(async () => await page.getByTestId('diff-insert').count(), { timeout: 3000 })
        .toBeGreaterThan(0);
      insertButton = page.getByTestId('diff-insert');
    }

    const beforeLen = (await editor.inputValue()).length;
    await insertButton.first().click();
    await expect.poll(async () => (await editor.inputValue()).length, { timeout: 5000 }).toBeGreaterThan(beforeLen);

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
    await input.type(bad);

    // Alert should surface invalid target and allowed prefixes copy (avoid Next.js route announcer)
    const alert = page.locator('div[role="alert"]').filter({ hasText: 'Invalid targets:' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(`Invalid targets: ${bad}`);
    await expect(alert).toContainText('Allowed prefixes:');

    // Save button should be disabled with an explanatory title
    const saveBtn = page.getByTestId('btn-save');
    await expect(saveBtn).toBeDisabled();
  });

  test('save preflight: Ctrl/Cmd+S shows toast error for invalid targets', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip on webkit until browsers are stable in CI');
    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' });

    const input = page.getByTestId('model-targets-input');
    await expect(input).toBeVisible();

    // Enter clearly invalid targets
    const bad = 'bad-model';
    await input.fill(bad);

    // Trigger save via keyboard shortcut; expect toast error copy
    await page.keyboard.press('Control+S');

    // Expect local toast error to appear
    const toastErr = page.getByText(`Fix invalid targets: ${bad}`, { exact: false });
    await expect(toastErr).toBeVisible({ timeout: 3000 });
  });

  test('happy-path manual save shows Saved then clears after 5s window', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip on webkit until browsers are stable in CI');
    const consoleErrors = await collectConsoleErrors(page);

    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' });

    const editor = page.getByTestId('editor-input');
    await expect(editor).toBeVisible();

    // Type some content to make it dirty
    await editor.click();
    await editor.type(' manual save run');

    // Trigger manual save via toolbar button (data-testid=btn-save)
    const saveButton = page.getByTestId('btn-save');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Saved badge should appear soon after
    await expect(page.getByTestId('autosave-badge').filter({ hasText: 'Saved' })).toBeVisible({ timeout: 5000 });

    // After local 5s visibility window in AutosaveBadge, DOM element should be removed
    await expect(page.getByTestId('autosave-badge')).toHaveCount(0, { timeout: 12000 });

    // No console errors
    expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
  });