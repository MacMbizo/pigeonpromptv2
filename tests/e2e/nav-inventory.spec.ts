import { test, expect } from '@playwright/test';

// Verifies the Inventory nav link appears in headers and navigates correctly from Templates and Library pages

test.describe('Navigation: Inventory link in headers', () => {
  test('Templates header -> Inventory', async ({ page }) => {
    await page.goto('/templates', { waitUntil: 'domcontentloaded' });

    const link = page.getByTestId('nav-inventory');
    await expect(link, 'Inventory link should be visible on Templates header').toBeVisible();

    await Promise.all([
      page.waitForURL(/\/inventory$/),
      link.click(),
    ]);

    // Assert Inventory page loaded via stable test ids
    await expect(page.getByTestId('context-builder-title')).toBeVisible();
    await expect(page.getByTestId('cost-hud')).toBeVisible();
  });

  test('Library header -> Inventory', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'domcontentloaded' });

    const link = page.getByTestId('nav-inventory');
    await expect(link, 'Inventory link should be visible on Library header').toBeVisible();

    await Promise.all([
      page.waitForURL(/\/inventory$/),
      link.click(),
    ]);

    // Assert Inventory page loaded via stable test ids
    await expect(page.getByTestId('context-builder-title')).toBeVisible();
    await expect(page.getByTestId('cost-hud')).toBeVisible();
  });
});