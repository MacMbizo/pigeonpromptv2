import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

test.describe('Library: New Prompt creation flow', () => {
  test('opens modal, validates, creates prompt and redirects to Studio', async ({ page }) => {
    // Go to Library
    await page.goto(`${APP_URL}/library`, { waitUntil: 'networkidle' });

    // Ensure the New Prompt button is visible and click it
    const newPromptBtn = page.getByRole('button', { name: 'New Prompt' });
    await expect(newPromptBtn).toBeVisible();
    await newPromptBtn.click();

    // Expect modal heading to be visible (more direct than dialog name resolution)
    const modalHeading = page.getByRole('heading', { name: 'Create New Prompt' });
    await expect(modalHeading).toBeVisible();

    // Attempt submit with empty name to trigger inline validation
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Name is required')).toBeVisible();

    // Fill the form
    const unique = `E2E ${Date.now()}`;
    await page.getByLabel('Name').fill(unique);
    await page.getByLabel('Description (optional)').fill('Created by Playwright E2E');

    // Submit
    await page.getByRole('button', { name: 'Create' }).click();

    // We should be redirected to /studio/:id and see the Studio heading
    await expect(page).toHaveURL(/\/studio\//);
    await expect(page.getByRole('heading', { name: 'Prompt Studio' })).toBeVisible();
  });

  test('modal closes via X button', async ({ page }) => {
    await page.goto(`${APP_URL}/library`, { waitUntil: 'networkidle' });

    // Open modal
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).toBeVisible();

    // Close via X button
    await page.getByRole('button', { name: 'Close' }).click();

    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).not.toBeVisible();
  });

  test('modal closes via Cancel button', async ({ page }) => {
    await page.goto(`${APP_URL}/library`, { waitUntil: 'networkidle' });

    // Open modal
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).toBeVisible();

    // Close via Cancel button
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).not.toBeVisible();
  });

  test('modal closes via Escape key', async ({ page }) => {
    await page.goto(`${APP_URL}/library`, { waitUntil: 'networkidle' });

    // Open modal
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).toBeVisible();

    // Close via Escape key
    await page.keyboard.press('Escape');

    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).not.toBeVisible();
  });

  test('modal closes via backdrop click', async ({ page }) => {
    await page.goto(`${APP_URL}/library`, { waitUntil: 'networkidle' });

    // Open modal
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).toBeVisible();

    // Click backdrop (outside dialog but inside overlay)
    // The backdrop element is the absolute inset overlay behind the dialog
    await page.locator('div.absolute.inset-0').click({ position: { x: 10, y: 10 } });

    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).not.toBeVisible();
  });

  test('create button disabled state during submission', async ({ page }) => {
    // Deterministic network gate: hold fulfillment until UI enters "Creating..." state
    let release!: () => void;
    const gate = new Promise<void>((res) => { release = () => res(); });

    await page.route('/api/prompts', async (route) => {
      await gate; // wait until we confirm disabled state, then resolve
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: '12345678-1234-1234-1234-123456789abc', name: 'Test Prompt' })
      });
    });

    await page.goto(`${APP_URL}/library`, { waitUntil: 'networkidle' });

    // Open modal and fill form
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).toBeVisible();
    await page.getByLabel('Name').fill('Test Prompt');

    // Submit and verify button is disabled with "Creating..." text
    await page.getByRole('button', { name: 'Create' }).click();
    const creatingBtn = page.getByRole('button', { name: 'Creating...' });
    await expect(creatingBtn).toBeVisible();
    await expect(creatingBtn).toBeDisabled();

    // Verify other modal controls are also disabled during submission
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Close' })).toBeDisabled();

    // release the mocked response once we've observed the disabled state
    release();

    // Optional: modal should close after successful creation
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).not.toBeVisible();
  });

  test('displays server error from API', async ({ page }) => {
    // Mock API to return an error
    await page.route('/api/prompts', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Prompt name already exists' } })
      });
    });

    await page.goto(`${APP_URL}/library`, { waitUntil: 'networkidle' });

    // Open modal, fill form, and submit
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).toBeVisible();

    await page.getByLabel('Name').fill('Duplicate Name');
    await page.getByRole('button', { name: 'Create' }).click();

    // Error should be displayed
    await expect(page.getByText('Prompt name already exists')).toBeVisible();

    // Modal should remain open
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).toBeVisible();
  });

  test('displays generic error for unexpected server responses', async ({ page }) => {
    // Mock API to return a 500 error without structured error message
    await page.route('/api/prompts', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${APP_URL}/library`, { waitUntil: 'networkidle' });

    // Open modal, fill form, and submit
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).toBeVisible();

    await page.getByLabel('Name').fill('Random Name');
    await page.getByRole('button', { name: 'Create' }).click();

    // Generic error should be displayed
    await expect(page.getByText('Failed to create prompt')).toBeVisible();
    
    // Modal should remain open
    await expect(page.getByRole('heading', { name: 'Create New Prompt' })).toBeVisible();
  });
});