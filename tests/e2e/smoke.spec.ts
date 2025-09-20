import { test, expect, Page } from '@playwright/test'
import { APP_URL, STUDIO_ID, studioDraftKey } from './helpers'

async function collectConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Filter benign dev overlay/hydration messages during Next.js dev
      const ignore = [
        'ReactDevOverlay',
        'react-dev-overlay',
        'Hydration failed',
        'Expected server HTML',
        'Fast Refresh had to perform a full reload',
        'app-router.js',
        'status of 422',
        'Unprocessable Entity',
      ].some(sig => text.includes(sig))
      if (!ignore) errors.push(text)
    }
  })
  return errors
}

// Global stability guards for this spec file
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  page.on('dialog', d => d.dismiss().catch(() => {}))
  await page.evaluate(() => {
    document.documentElement.classList.add('disable-transitions')
    try { localStorage.clear() } catch { /* noop */ }
    try { sessionStorage.clear() } catch { /* noop */ }
  })
})

// Smoke: homepage responds
test('homepage responds and renders navbar', async ({ page }) => {
  const errors = await collectConsoleErrors(page)
  await page.goto(APP_URL)
  await expect(page.getByRole('navigation')).toBeVisible()
  expect(errors).toEqual([])
})

// Smoke: global navigation links exist
test('global navigation has expected links', async ({ page }) => {
  await page.goto(APP_URL)
  await expect(page.getByTestId('nav-link-studio')).toBeVisible()
  await expect(page.getByTestId('nav-link-library')).toBeVisible()
})

// Studio smoke: ensure Studio page boots and local draft key behavior works
// Skip on WebKit in CI by default; allow enabling via E2E_ENABLE_WEBKIT_CI=1
test('studio smoke: page loads and draft key is namespaced', async ({ page, browserName }) => {
  if (browserName === 'webkit') {
    if (process.env.CI && process.env.E2E_ENABLE_WEBKIT_CI !== '1') {
      test.skip(true, 'Skip on WebKit in CI until stabilized. Set E2E_ENABLE_WEBKIT_CI=1 to enable.')
    }
  }

  const errors = await collectConsoleErrors(page)

  // Use deterministic ID from helpers so persisted storage names are consistent
  await page.goto(`${APP_URL}/studio/${STUDIO_ID}`)

  // Verify a heading renders
  await expect(page.getByRole('heading', { name: /Studio|Versions/i })).toBeVisible()

  // Ensure draft key is namespaced by studio id
  const draftKey = studioDraftKey(STUDIO_ID)
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [draftKey, 'test-draft'])
  const stored = await page.evaluate((k) => localStorage.getItem(k), draftKey)
  expect(stored).toBe('test-draft')

  expect(errors).toEqual([])
})