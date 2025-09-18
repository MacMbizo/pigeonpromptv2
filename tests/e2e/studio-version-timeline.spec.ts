import { test, expect, Page } from '@playwright/test';

const APP_URL = process.env['APP_URL'] || 'http://localhost:3100';
const STUDIO_ID = process.env['STUDIO_ID'] || 'dev';

async function collectConsoleErrors(page: Page) {
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

async function gotoStudio(page: Page) {
  await page.goto(`${APP_URL}/studio/${STUDIO_ID}`);
  await expect(page.getByRole('heading', { name: 'Versions' })).toBeVisible();
}

// Helper reserved for future use; keep commented to avoid lint error
// const versionButton = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^v${n}\\b`) });

// Validate version timeline selection and diff panel presence with robust assertions
// Relies on dev fallback versions when prompt is missing (see /api/prompts/[id]/versions route).

test('Version timeline: selecting a version highlights it and diff panel is present', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Skip on webkit until browsers are stable in CI');

  const consoleErrors = await collectConsoleErrors(page);
  await gotoStudio(page);

  // Click v1 and assert it becomes selected (selected style class present)
  await page.getByTestId('version-item-1').click();
  await expect(page.getByTestId('version-item-1')).toHaveClass(/bg-blue-100/);

  // Click v2 and assert it becomes selected
  await page.getByTestId('version-item-2').click();
  await expect(page.getByTestId('version-item-2')).toHaveClass(/bg-blue-100/);

  // Diff & Changelog panel visible
  await expect(page.getByTestId('diff-panel')).toBeVisible();

  // Either there are no differences OR we have a rendered diff view.
  const noDiff = page.getByText('No differences');
  if (await noDiff.count()) {
    // If the marker exists, ensure it's visible
    await expect(noDiff).toBeVisible();
  } else {
    // Assert diff stats badges are visible regardless of actual counts
    await expect(page.getByTestId('diff-stats-added')).toBeVisible();
    await expect(page.getByTestId('diff-stats-removed')).toBeVisible();
    await expect(page.getByTestId('diff-stats-modified')).toBeVisible();

    // Toggle side-by-side to assert headers render
    await page.getByTestId('diff-side-by-side').check();
    await expect(page.getByText('Base')).toBeVisible();
    await expect(page.getByText('Draft')).toBeVisible();
  }

  // Changelog editor behaves: type then clear
  const changelogInput = page.getByTestId('changelog-input');
  await expect(changelogInput).toBeVisible();
  await changelogInput.fill('E2E: verify timeline selection');
  const clearBtn = page.getByTestId('changelog-clear');
  await expect(clearBtn).toBeEnabled();
  await clearBtn.click();
  await expect(changelogInput).toHaveValue('');

  expect(consoleErrors).toEqual([]);
});