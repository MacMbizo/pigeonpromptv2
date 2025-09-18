import { test, expect } from '@playwright/test'

// Enable video capture for this demo spec regardless of global config
test.use({ video: 'on' })

// Record a short interaction showcasing the inline "Context Preview" subheading and the toggles.
// Output: Playwright will save a video per test when configured via test.use above.

const STUDIO_ID = '10000000-0000-0000-0000-000000000001'

test.describe('Record: Context Preview micro-demo', () => {
  test('subheading visible and basic toggles interaction', async ({ page }) => {
    // Navigate to Studio page using configured baseURL
    const resp = await page.goto(`/studio/${STUDIO_ID}`, { waitUntil: 'domcontentloaded' })
    expect(resp?.ok(), 'studio page should respond').toBeTruthy()

    // Ensure preview panel and subheading are visible
    await expect(page.getByTestId('preview-panel')).toBeVisible()
    // Subheading is a heading element; assert by role and name for robustness
    await expect(page.getByRole('heading', { name: 'Context Preview' })).toBeVisible()

    // Interact with include/exclude toggle for the first context row if present
    const rows = page.getByTestId('context-file-row')
    if (await rows.count()) {
      const first = rows.first()
      const toggle = first.getByTestId('include-toggle')
      await expect(toggle).toBeVisible()
      await toggle.click()
      await page.waitForTimeout(400) // allow UI state to settle for the recording
      await toggle.click()
    }

    // Ensure token HUD visible
    await expect(page.getByTestId('token-hud')).toBeVisible()

    // Type into preview variable inputs if they exist to demonstrate live update
    const userInput = page.getByTestId('preview-var-input-user_input')
    const contextInput = page.getByTestId('preview-var-input-context')
    if (await userInput.count()) {
      await userInput.fill('Alice')
    }
    if (await contextInput.count()) {
      await contextInput.fill('Docs')
    }

    const previewOutput = page.getByTestId('preview-output')
    await expect(previewOutput).toBeVisible()
    // Brief pause to help the video capture the final state
    await page.waitForTimeout(800)
  })
})