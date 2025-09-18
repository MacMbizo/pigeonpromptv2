import { test, expect } from '@playwright/test';

// Deterministic visual regression snapshots for the app header (light/dark)
// We capture the sticky header only to reduce flake and isolate nav visual regressions.

async function setColorScheme(page: import('@playwright/test').Page, mode: 'light' | 'dark') {
  // Force prefers-color-scheme for Tailwind dark variants; use runtime override for deterministic state
  await page.addInitScript((m) => {
    const mode = m as 'light' | 'dark';
    // Override matchMedia for prefers-color-scheme
    const mq = window.matchMedia;
    // @ts-ignore
    window.matchMedia = (query: string) => {
      if (query.includes('prefers-color-scheme')) {
        return {
          matches: mode === 'dark',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as any;
      }
      return mq(query);
    };

    // Also set a body attribute hook if app uses it in future
    document.documentElement.setAttribute('data-test-color-scheme', mode);
  }, mode);
}

test.describe('Header visual regression', () => {
  test('light theme header snapshot', async ({ page }) => {
    await setColorScheme(page, 'light');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const header = page.getByTestId('app-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('header-light.png', { animations: 'disabled' });
  });

  test('dark theme header snapshot', async ({ page }) => {
    await setColorScheme(page, 'dark');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const header = page.getByTestId('app-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('header-dark.png', { animations: 'disabled' });
  });
});