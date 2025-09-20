import { test, expect } from '@playwright/test';
import { APP_URL, STUDIO_ID } from './helpers';

// This spec validates the Live Preview panel behavior on the Studio page.
// It relies on the development fallbacks of the API to provide a prompt with variables
// and versions content like: "Hello {{user_input}}\n\nUse context: {{context}}".

test.beforeEach(async ({ page }) => {
  // Reduce motion and disable transitions for stability
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });
  // Auto-dismiss any dialogs that could block the run
  page.on('dialog', d => d.dismiss().catch(() => {}));
  // Clear storages for isolation between tests
  await page.addInitScript(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* noop */ }
  });
});

test.describe('Studio Live Preview', () => {
  test('updates output as variables change and respects missing policy + reset', async ({ page }) => {
    // Inserted console error collector
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

    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`);

    // Ensure editor and preview panel are present
    await expect(page.getByTestId('editor-input')).toBeVisible();
    const previewPanel = page.getByTestId('preview-panel');
    await expect(previewPanel).toBeVisible();

    const previewOutput = page.getByTestId('preview-output');
    const policySelect = page.getByTestId('preview-policy');

    // Default policy is "annotate"; with empty inputs we should see missing annotations
    // Verify key fragments instead of exact text to be resilient to whitespace
    await expect(previewOutput).toContainText('[MISSING:user_input]');
    await expect(previewOutput).toContainText('[MISSING:context]');

    // Type values into variable inputs and verify preview updates
    const userInput = page.getByTestId('preview-var-input-user_input');
    const contextInput = page.getByTestId('preview-var-input-context');

    await userInput.fill('Alice');
    await contextInput.fill('Docs');

    await expect(previewOutput).toContainText('Hello Alice');
    await expect(previewOutput).toContainText('Use context: Docs');

    // Reset values should clear the inputs and preview should show annotations again (still on "annotate")
    await page.getByRole('button', { name: 'Reset values' }).click();

    await expect(userInput).toHaveValue('');
    await expect(contextInput).toHaveValue('');
    await expect(previewOutput).toContainText('[MISSING:user_input]');
    await expect(previewOutput).toContainText('[MISSING:context]');

    // Change policy to "Leave placeholder" and verify raw placeholders appear
    await policySelect.selectOption('leave');
    await expect(previewOutput).toContainText('Hello {{user_input}}');
    await expect(previewOutput).toContainText('Use context: {{context}}');

    // Change policy to "Replace with empty" and verify placeholders are removed
    await policySelect.selectOption('empty');
    await expect(previewOutput).toContainText('Hello');
    await expect(previewOutput).toContainText('Use context:');
    // And specifically ensure the placeholder label isn't there
    await expect(previewOutput).not.toContainText('{{user_input}}');
    await expect(previewOutput).not.toContainText('{{context}}');

    // Change policy to "Throw error" and expect an error alert to appear
    await policySelect.selectOption('error');
    // Error badge appears and an alert with the message
    const alert = previewPanel.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Missing template variable:');

    // Switch back to annotate, fill values again and verify no error and rendered text
    await policySelect.selectOption('annotate');
    await userInput.fill('Alice');
    await contextInput.fill('Docs');
    await expect(previewPanel.getByRole('alert')).toHaveCount(0);
    await expect(previewOutput).toContainText('Hello Alice');
    await expect(previewOutput).toContainText('Use context: Docs');
    // Inside the test, after await page.goto(`${APP_URL}/studio/${STUDIO_ID}`);
    const consoleErrors = await collectConsoleErrors(page);
    // At the end of the test, before });
    expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
  });
});