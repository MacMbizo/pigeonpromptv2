import { test, expect } from '@playwright/test';

// Keyboard navigation: tab through the top navigation and assert focus styles are visible
// We assert two things:
// 1) Focus moves in the expected order across brand + nav links
// 2) For nav links that include explicit focus-visible ring styles, computed box-shadow is not "none" when focused

test('top nav: keyboard focus order + visible focus ring', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Define expected tab order from the header: brand link, then primary nav links
  const order: Array<{ name: string; testId: string; expectRing: boolean }> = [
    { name: 'Brand', testId: 'nav-link-home', expectRing: false },
    { name: 'Home', testId: 'nav-link-home-2', expectRing: true },
    { name: 'Inventory', testId: 'nav-link-inventory', expectRing: true },
    { name: 'Playground', testId: 'nav-link-playground', expectRing: true },
    { name: 'Studio', testId: 'nav-link-studio', expectRing: true },
    { name: 'Library', testId: 'nav-link-library', expectRing: true },
    { name: 'Templates', testId: 'nav-link-templates', expectRing: true },
  ];

  // Reset focus to the page before tabbing
  await page.mouse.click(0, 0);

  for (const step of order) {
    await page.keyboard.press('Tab');
    const link = page.getByTestId(step.testId);
    await expect(link, `Expected ${step.name} to receive focus`).toBeFocused();

    if (step.expectRing) {
      // Tailwind focus-visible ring utilities apply a box-shadow when focused via keyboard
      const boxShadow = await link.evaluate((el) => getComputedStyle(el as HTMLElement).boxShadow);
      expect(
        !!boxShadow && boxShadow !== 'none',
        `Focus ring (box-shadow) should be visible on ${step.name} when focused via keyboard`
      ).toBeTruthy();
    }
  }
});