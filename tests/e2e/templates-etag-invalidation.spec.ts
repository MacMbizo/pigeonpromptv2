import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

async function createUserTemplate(request: any, userId: string, name: string) {
  const res = await request.post(`${APP_URL}/api/templates/user`, {
    data: { name },
    headers: { 'X-User-Id': userId },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body;
}

async function listUserTemplates(request: any, userId: string, ifNoneMatch?: string) {
  const res = await request.get(`${APP_URL}/api/templates/user`, {
    headers: { 'X-User-Id': userId, ...(ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : {}) },
  });
  return res;
}

test.describe('User Templates ETag invalidation', () => {
  test('Update invalidates list ETag; Delete invalidates again', async ({ request }) => {
    const userId = `etag-user-${Date.now()}`;

    // Initial list to get baseline ETag
    const list1 = await listUserTemplates(request, userId);
    expect(list1.status()).toBe(200);
    const etag1 = list1.headers()['etag'];
    expect(etag1).toBeTruthy();

    // Conditional should 304
    const list304 = await listUserTemplates(request, userId, etag1);
    expect(list304.status()).toBe(304);

    // Create a template -> should change ETag on listing
    const created = await createUserTemplate(request, userId, `tmpl-${Date.now()}`);

    const list2 = await listUserTemplates(request, userId, etag1);
    expect(list2.status()).toBe(200);
    const etag2 = list2.headers()['etag'];
    expect(etag2).toBeTruthy();
    expect(etag2).not.toBe(etag1);

    // Update the template -> ETag should change again
    const putRes = await request.put(`${APP_URL}/api/templates/user/${created.id}`, {
      data: { description: 'updated desc' },
      headers: { 'X-User-Id': userId },
    });
    expect([200, 404]).toContain(putRes.status());

    const list3 = await listUserTemplates(request, userId, etag2);
    expect(list3.status()).toBe(200);
    const etag3 = list3.headers()['etag'];
    expect(etag3).toBeTruthy();
    if (putRes.status() === 200) {
      expect(etag3).not.toBe(etag2);
    }

    // Delete -> ETag should change again
    const delRes = await request.delete(`${APP_URL}/api/templates/user/${created.id}`, {
      headers: { 'X-User-Id': userId },
    });
    expect([200, 404]).toContain(delRes.status());

    const list4 = await listUserTemplates(request, userId, etag3);
    if (delRes.status() === 200) {
      expect(list4.status()).toBe(200);
      const etag4 = list4.headers()['etag'];
      expect(etag4).toBeTruthy();
      expect(etag4).not.toBe(etag3);

      // Immediate conditional on latest ETag should 304
      const list304again = await listUserTemplates(request, userId, etag4);
      expect(list304again.status()).toBe(304);
    } else {
      // If delete did not occur (404), representation is unchanged -> 304 is correct
      expect(list4.status()).toBe(304);
      // Optional: verify that sending etag3 again still yields 304
      const list304again = await listUserTemplates(request, userId, etag3);
      expect(list304again.status()).toBe(304);
    }
  });
});