import { test, expect, Page } from '@playwright/test';
import { APP_URL, STUDIO_ID } from './helpers'

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

  // Ensure listbox is present and labeled
  const listbox = page.getByRole('listbox', { name: 'Versions' });
  await expect(listbox).toBeVisible();

  // Click v1 and assert it becomes selected using ARIA roles (scoped within listbox)
  await listbox.getByRole('option', { name: /^v1\b/ }).click();
  await expect(listbox.getByRole('option', { name: /^v1\b/ })).toHaveAttribute('aria-selected', 'true');

  // Click v2 and assert it becomes selected
  await listbox.getByRole('option', { name: /^v2\b/ }).click();
  await expect(listbox.getByRole('option', { name: /^v2\b/ })).toHaveAttribute('aria-selected', 'true');

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

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  page.on('dialog', d => d.dismiss().catch(() => { /* noop */ }))
  await page.evaluate(() => {
    document.documentElement.classList.add('disable-transitions')
    try { localStorage.clear(); } catch { /* noop */ }
    try { sessionStorage.clear(); } catch { /* noop */ }
  })
})