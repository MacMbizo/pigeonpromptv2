import { test, expect } from '@playwright/test';

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

const APP_URL = process.env.APP_URL || 'http://localhost:3100';
const STUDIO_ID = '10000000-0000-0000-0000-000000000001';

// Verifies the Live Preview copy-to-clipboard functionality.
// This spec mocks API routes for deterministic content.

test.describe('Studio Live Preview - Copy', () => {
  test('copies rendered preview text to the clipboard', async ({ page /*, context */ }) => {
    const promptId = STUDIO_ID;

    // Mock Studio data fetches
    await page.route(`**/api/prompts/${promptId}`, async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: promptId,
          author_id: 'test-user',
          name: 'Preview Copy',
          description: null,
          variables: [
            { name: 'user_input' },
            { name: 'context' },
          ],
          status: 'draft',
          score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    });

    await page.route(`**/api/prompts/${promptId}/versions`, async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'v1',
              prompt_id: promptId,
              version: 1,
              content: 'Hello {{user_input}}\n\nUse context: {{context}}',
              model_targets: [],
              changelog: null,
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    // Navigate to Studio
    await page.goto(`${APP_URL}/studio/${STUDIO_ID}`);

    // Ensure preview panel is visible
    await expect(page.getByTestId('preview-panel')).toBeVisible();

    // Fill variables
    await page.getByTestId('preview-var-input-user_input').fill('Alice');
    await page.getByTestId('preview-var-input-context').fill('Docs');

    // Wait for preview output to reflect values
    const previewOutput = page.getByTestId('preview-output');
    await expect(previewOutput).toContainText('Hello Alice');
    await expect(previewOutput).toContainText('Use context: Docs');

    // In browsers like Firefox, requesting clipboard permissions or using navigator.clipboard.readText
    // is restricted. Instead, intercept writeText to capture what would be copied.
    await page.evaluate(() => {
      (window as any).__copiedText = '';
      const nav: any = navigator as any;
      const stub = async (t: string) => { (window as any).__copiedText = t; };
      if (!nav.clipboard) {
        nav.clipboard = { writeText: stub };
      } else if (typeof nav.clipboard.writeText === 'function') {
        nav.clipboard.writeText = stub;
      } else {
        nav.clipboard.writeText = stub;
      }
    });

    // Click Copy output button
    await expect(page.getByTestId('preview-copy')).toBeVisible();
    await page.getByTestId('preview-copy').click();

    // Assert the intercepted copied text
    const copied = await page.evaluate(() => (window as any).__copiedText as string);

    expect(copied).toContain('Hello Alice');
    expect(copied).toContain('Use context: Docs');

    const consoleErrors = await collectConsoleErrors(page);
    expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
  });
});