import { test, expect, APIRequestContext } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

async function createPublicPrompt(api: APIRequestContext, name: string) {
  const res = await api.post(`${APP_URL}/api/prompts`, {
    data: { name, description: 'e2e', status: 'public', variables: [] },
  });
  expect(res.status(), 'create prompt status').toBe(201);
  const body = await res.json();
  expect(body?.id).toBeTruthy();
  return body;
}

test.describe('ETag caching', () => {
  test('prompt detail: 200 -> 304, then invalidated after update', async ({ request }) => {
    const created = await createPublicPrompt(request, `e2e-etag-detail-${Date.now()}`);

    // First GET
    const res1 = await request.get(`${APP_URL}/api/prompts/${created.id}`);
    expect(res1.status()).toBe(200);
    const etag1 = res1.headers()['etag'];
    expect(etag1, 'ETag present').toBeTruthy();
    const body1 = await res1.json();
    expect(body1.id).toBe(created.id);

    // Conditional GET should 304
    const res304 = await request.get(`${APP_URL}/api/prompts/${created.id}`, {
      headers: { 'If-None-Match': etag1! },
    });
    expect(res304.status()).toBe(304);

    // Update prompt to invalidate ETag
    const patchRes = await request.patch(`${APP_URL}/api/prompts/${created.id}`, {
      data: { name: `${body1.name}-updated`, ifMatchUpdatedAt: body1.updated_at },
      headers: { 'If-Match': body1.updated_at },
    });
    expect([200, 409]).toContain(patchRes.status());

    // Now conditional GET with old ETag should be 200 (changed)
    const res2 = await request.get(`${APP_URL}/api/prompts/${created.id}`, {
      headers: { 'If-None-Match': etag1! },
    });
    expect(res2.status()).toBe(200);
    const etag2 = res2.headers()['etag'];
    expect(etag2).toBeTruthy();
    expect(etag2).not.toBe(etag1);
  });

  test('catalog: 200 -> 304, then invalidated after new public prompt', async ({ request }) => {
    // Use a unique query filter to isolate from concurrent tests mutating the public catalog
    const prefix = `e2e-etag-catalog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const url = `${APP_URL}/api/catalog/prompts?page=1&size=5&sort=created_desc&q=${encodeURIComponent(prefix)}`;

    const list1 = await request.get(url);
    expect(list1.status()).toBe(200);
    const catEtag1 = list1.headers()['etag'];
    expect(catEtag1, 'ETag present').toBeTruthy();

    // 304 on conditional
    const list304 = await request.get(url, { headers: { 'If-None-Match': catEtag1! } });
    expect(list304.status()).toBe(304);

    // Create a new public prompt with the same prefix so it impacts this filtered catalog
    await createPublicPrompt(request, `${prefix} ${Date.now()}`);

    // Now conditional should be 200 and ETag should change
    const list2 = await request.get(url, { headers: { 'If-None-Match': catEtag1! } });
    expect(list2.status()).toBe(200);
    const catEtag2 = list2.headers()['etag'];
    expect(catEtag2).toBeTruthy();
    expect(catEtag2).not.toBe(catEtag1);

    // And immediate conditional on new ETag returns 304
    const list304again = await request.get(url, { headers: { 'If-None-Match': catEtag2! } });
    expect(list304again.status()).toBe(304);
  });
});