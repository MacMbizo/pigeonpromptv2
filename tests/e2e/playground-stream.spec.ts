import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

test.describe('Playground Stream Mode', () => {
  test('enabling Stream mode shows live HUD and final metrics', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip webkit intermittently in CI');

    await page.goto(`${APP_URL}/playground`);
    await expect(page.getByTestId('playground-page')).toBeVisible();

    // Enable stream mode
    const toggle = page.getByTestId('stream-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();

    // Enter a prompt
    const prompt = page.getByTestId('prompt-input');
    await prompt.fill('Name three core principles of unit testing.');

    // Run left only for clarity
    await page.getByTestId('run-left').click();

    // Live HUD should appear while streaming
    const leftHud = page.getByTestId('result-left-hud');
    await expect(leftHud).toBeVisible();
    await expect(leftHud).toContainText('tok');

    // Output should stream into left panel; match the DevAdapter streaming signature
    const leftOut = page.getByTestId('output-left');
    await expect(leftOut).toBeVisible();
    await expect(leftOut).toContainText('Streaming response id', { timeout: 15000 });

    // When done, HUD should include ms and a cost placeholder/value
    await expect(leftHud).toContainText('ms');
    await expect(leftHud).toContainText('–');
  });
});