import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test'


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

// --- Templates API helpers for test isolation ---
export async function apiListUserTemplates(request: APIRequestContext, userId: string) {
  const res = await request.get(`/api/templates/user?userId=${encodeURIComponent(userId)}`, {
    headers: { 'x-user-id': userId },
  });
  if (!res.ok()) throw new Error(`Failed to list templates for ${userId}: ${res.status()} ${await res.text()}`);
  const body = await res.json();
  const items = Array.isArray(body) ? body : body?.items;
  return (items ?? []) as Array<{ id: string; name?: string; updated_at?: string }>;
}

export async function apiDeleteUserTemplate(request: APIRequestContext, userId: string, id: string, ifMatch?: string) {
  const res = await request.delete(`/api/templates/user/${encodeURIComponent(id)}`, {
    headers: {
      'x-user-id': userId,
      ...(ifMatch ? { 'if-match': ifMatch } : {}),
    },
  });
  if (!res.ok()) {
    // 404 is fine for cleanup semantics
    if (res.status() !== 404) {
      throw new Error(`Failed to delete template ${id} for ${userId}: ${res.status()} ${await res.text()}`);
    }
  }
  return res.ok();
}

export async function cleanupUserTemplates(request: APIRequestContext, userId: string) {
  try {
    const templates = await apiListUserTemplates(request, userId);
    for (const t of templates) {
      await apiDeleteUserTemplate(request, userId, t.id);
    }
  } catch (e) {
    // Best-effort cleanup; log to console but do not fail hooks
    // eslint-disable-next-line no-console
    console.warn('cleanupUserTemplates warning:', e);
  }
}


export const APP_URL = process.env.APP_URL || 'http://localhost:3100'

// Centralized deterministic Studio ID for all specs unless overridden in a specific test
export const STUDIO_ID = process.env.E2E_STUDIO_ID || '10000000-0000-0000-0000-000000000001'

// Compute the draft localStorage key consistently
export const studioDraftKey = (studioId: string = STUDIO_ID) => `pigeon:studio:${studioId}:draft`

// Common navigation helper
export async function gotoStudio(page: Page, studioId: string = STUDIO_ID) {
  await page.goto(`${APP_URL}/studio/${studioId}`)
}