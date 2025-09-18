import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Wait for either the Saved badge to appear or a persisted localStorage draft.
 * If expectedContent is provided, asserts that the persisted draft contains it; otherwise asserts non-empty content.
 */
export async function waitForSavedBadgeOrPersistedDraft(
  page: Page,
  draftKey: string,
  expectedContent?: string,
  options?: { timeoutMs?: number }
) {
  const timeoutMs = options?.timeoutMs ?? 7000;
  const saved = page.getByTestId('autosave-badge').filter({ hasText: 'Saved' });
  try {
    await expect(saved).toBeVisible({ timeout: 3000 });
    return;
  } catch {
    // fall through to localStorage validation
  }

  if (expectedContent) {
    await expect.poll(async () => {
      const raw = await page.evaluate((key) => localStorage.getItem(key), draftKey);
      if (!raw) return '';
      try {
        const parsed = JSON.parse(raw as string);
        return parsed?.content || '';
      } catch {
        return '';
      }
    }, { timeout: timeoutMs }).toContain(expectedContent);
  } else {
    await expect.poll(async () => {
      const raw = await page.evaluate((key) => localStorage.getItem(key), draftKey);
      if (!raw) return '';
      try {
        const parsed = JSON.parse(raw as string);
        return parsed?.content || '';
      } catch {
        return '';
      }
    }, { timeout: timeoutMs }).not.toBe('');
  }
}