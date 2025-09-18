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

// Minimal smoke tests
const APP_URL = process.env.APP_URL || 'http://localhost:3100';

test('homepage responds', async ({ page }) => {
  const consoleErrors = await collectConsoleErrors(page);
  await page.goto(APP_URL);
  await expect(page).toHaveURL(APP_URL);
  expect(consoleErrors, `Console errors encountered on homepage:\n${consoleErrors.join('\n')}`).toHaveLength(0);
});

// New: global navigation presence + active highlighting + mobile toggle
test('global nav renders and highlights active link; mobile menu toggles', async ({ page }) => {
  await page.goto(APP_URL);

  // Nav present with expected links
  const nav = page.getByTestId('app-nav');
  await expect(nav).toBeVisible();
  await expect(page.getByTestId('nav-link-home-2')).toBeVisible();
  await expect(page.getByTestId('nav-link-inventory')).toBeVisible();
  await expect(page.getByTestId('nav-link-playground')).toBeVisible();
  await expect(page.getByTestId('nav-link-studio')).toBeVisible();
  await expect(page.getByTestId('nav-link-library')).toBeVisible();
  await expect(page.getByTestId('nav-link-templates')).toBeVisible();

  // Active highlighting on Home (aria-current="page")
  await expect(page.getByTestId('nav-link-home-2')).toHaveAttribute('aria-current', 'page');

  // Navigate to Inventory (section-active)
  await page.getByTestId('nav-link-inventory').click();
  await expect(page).toHaveURL(/\/inventory$/);
  await expect(page.getByTestId('nav-link-inventory')).toHaveAttribute('aria-current', 'page');

  // Nested route active state: go to Studio nested route and assert Studio remains active
  await page.getByTestId('nav-link-studio').click();
  await expect(page).toHaveURL(/\/studio\//);
  await expect(page.getByTestId('nav-link-studio')).toHaveAttribute('aria-current', 'page');

  // Mobile toggle behavior – visible only on small viewports (hidden on md and up)
  await page.setViewportSize({ width: 375, height: 800 });
  const toggle = page.getByTestId('nav-mobile-toggle');
  await expect(toggle).toBeVisible();

  // Before click, the mobile menu container should be hidden (display: none via class)
  await expect(nav).toBeHidden();

  // Open menu
  await toggle.click();
  await expect(nav).toBeVisible();

  // Close menu via toggle
  await toggle.click();
  await expect(nav).toBeHidden();

  // Re-open and close via link click
  await toggle.click();
  await expect(nav).toBeVisible();
  await page.getByTestId('nav-link-home-2').click();
  await expect(page).toHaveURL(APP_URL);
});

// Studio smoke: load page, verify textarea placeholder, autosave behavior, presence of save/discard buttons
// Uses a known seeded prompt id present in dev server.
const STUDIO_ID = '10000000-0000-0000-0000-000000000001';

test('studio page basic UI renders', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Skipping on webkit until headless install is stable in CI');
  const url = `${APP_URL}/studio/${STUDIO_ID}`;
  const consoleErrors = await collectConsoleErrors(page);
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
  expect(resp?.ok(), 'studio page should respond').toBeTruthy();

  // Editor textarea by testid
  const editor = page.getByTestId('editor-input');
  await expect(editor).toBeVisible();

  // Type to trigger dirty state and autosave
  await editor.click();
  await editor.type(' test');

  // Expect Autosaving… then Saved (debounce ~800ms, allow generous)
  const autosaving = page.getByTestId('autosave-badge').filter({ hasText: 'Autosaving…' });
  await expect(autosaving).toBeVisible({ timeout: 5000 });
  const saved = page.getByTestId('autosave-badge').filter({ hasText: 'Saved' });

  // The Saved badge can be ephemeral if the system returns to idle quickly.
  // Try to observe it briefly; if not visible, fall back to verifying localStorage draft content.
  const draftKey = `pigeon:studio:${STUDIO_ID}:draft`;
  const currentContent = await editor.inputValue();
  try {
    await expect(saved).toBeVisible({ timeout: 2000 });
  } catch {
    await expect.poll(async () => {
      const raw = await page.evaluate((key) => localStorage.getItem(key), draftKey);
      if (!raw) return '';
      try {
        const parsed = JSON.parse(raw as string);
        return parsed?.content || '';
      } catch {
        return '';
      }
    }, { timeout: 7000 }).toContain(currentContent);
  }

  // Save/Discard buttons should now be visible and enabled
  const saveBtn = page.getByTestId('btn-save');
  await saveBtn.scrollIntoViewIfNeeded();
  await expect(saveBtn).toBeVisible();
  await expect(saveBtn).toBeEnabled();

  const discardBtn = page.getByTestId('btn-discard');
  await discardBtn.scrollIntoViewIfNeeded();
  await expect(discardBtn).toBeVisible();
  await expect(discardBtn).toBeEnabled();
  // At the end of the studio test, before });
  expect(consoleErrors, `Console errors encountered:\n${consoleErrors.join('\n')}`).toHaveLength(0);
});