import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

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

// This spec validates the presence and basic behavior of the Token Insights panel on the Studio page.
// It creates a new prompt via the Library flow to ensure we land on a valid Studio page.

test.describe('Studio Token Insights Panel', () => {
  test('renders, toggles, and shows basic stats', async ({ page }) => {
    const consoleErrors = await collectConsoleErrors(page);
    await page.goto(`${APP_URL}/library`);

    const promptId = '00000000-0000-4000-8000-000000000001';

    // Ensure creation succeeds consistently regardless of backend state
    await page.route('**/api/prompts', async (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: promptId, name: 'TI Smoke' }),
      });
    });

    // Mock Studio data fetches for the newly created prompt
    await page.route(`**/api/prompts/${promptId}`, async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: promptId,
          author_id: 'test-user',
          name: 'TI Smoke',
          description: null,
          variables: [],
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
              content: '',
              model_targets: [],
              changelog: null,
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    // Open the New Prompt modal
    await page.getByRole('button', { name: /New Prompt/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill minimal valid data and create (use accessible label for robustness)
    await page.getByLabel('Name').fill('TI Smoke');
    await page.getByRole('button', { name: /^Create$/ }).click();

    // We should be redirected to the Studio page
    await page.waitForURL('**/studio/**');

    // Ensure editor is present
    const editor = page.getByTestId('editor-input');
    await expect(editor).toBeVisible();

    // Locate the Token Insights <details> by testid
    const insights = page.getByTestId('token-insights');
    await expect(insights).toBeVisible();

    // Expand the panel (clicking summary toggles <details>)
    await insights.locator('summary').click();

    // Verify basic stats are visible
    await expect(page.getByTestId('ti-lines')).toBeVisible();
    await expect(page.getByTestId('ti-chars')).toBeVisible();
    // Target the content row, not the summary label, to avoid strict mode conflicts
    const tokensRow = page.getByTestId('ti-tokens');
    await expect(tokensRow).toBeVisible();

    // Type into editor and confirm stats change (Chars should update)
    const chars = page.getByTestId('ti-chars');
    const beforeChars = await chars.textContent();
    await editor.fill('Hello world!');
    await expect.poll(async () => await chars.textContent(), { timeout: 3000 }).not.toBe(beforeChars);

    // No console errors
    expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
  });
});