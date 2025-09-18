import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

async function seedPublicPrompt(page: import('@playwright/test').Page) {
  // Use API to seed a public prompt for the Library table
  const apiContext = page.context().request;
  const res = await apiContext.post(`${APP_URL}/api/prompts`, {
    data: {
      name: 'E2E Test Prompt',
      description: 'A test prompt for navigating Library to Studio',
      status: 'public',
      variables: []
    }
  });
  expect(res.status()).toBe(201);
  const { id } = await res.json();
  return id;
}

async function gotoLibrary(page: import('@playwright/test').Page) {
  await page.goto('/library', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /prompt library/i })).toBeVisible({ timeout: 10000 });
}

test('Library: first row link → Studio with nav activation', async ({ page }) => {
  // Debug: check environment setup
  const dbResponse = await page.request.get(`${APP_URL}/api/status/db`);
  if (dbResponse.ok()) {
    const dbStatus = await dbResponse.json();
    console.log('DB Status:', dbStatus);
  } else {
    console.log('DB status endpoint not OK:', dbResponse.status());
  }

  // Ensure we have at least one public prompt
  const promptId = await seedPublicPrompt(page);
  console.log('Seeded prompt ID:', promptId);
  
  await gotoLibrary(page);

  // Check if any prompts are listed at all
  const noPromptsMessage = page.getByText(/no prompts found/i);
  const hasNoPrompts = await noPromptsMessage.isVisible();
  console.log('Has no prompts message:', hasNoPrompts);

  // Click the seeded prompt link by accessible name to avoid brittle table selectors
  const nameLink = page.getByRole('link', { name: 'E2E Test Prompt' }).first();
  await expect(nameLink).toBeVisible({ timeout: 10000 });

  const href = await nameLink.getAttribute('href');
  expect(href, 'href should point to studio route').toMatch(/^\/studio\//);

  await Promise.all([
    page.waitForURL(/\/studio\//),
    nameLink.click(),
  ]);

  // Verify Studio nav link is active via aria-current and testid
  const studioNav = page.getByTestId('nav-link-studio');
  await expect(studioNav).toHaveAttribute('aria-current', 'page');

  // Sanity check: we're on a proper Studio page
  await expect(page.getByRole('heading', { name: /prompt studio/i })).toBeVisible({ timeout: 5000 });
});