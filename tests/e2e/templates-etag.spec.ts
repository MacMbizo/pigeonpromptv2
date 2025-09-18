import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

// This spec validates ETag semantics on the user templates listing endpoint
// using the dev fallback (empty list) when DB is unavailable.
// Flow: 200 with ETag -> 304 on If-None-Match -> 200 again on mismatched tag.
test.describe('User Templates ETag', () => {
  test('list: 200 -> 304 -> 200 (mismatched)', async ({ request }) => {
    const headers = { 'X-User-Id': 'e2e-u1' };
    const url = `${APP_URL}/api/templates/user`;

    const r1 = await request.get(url, { headers });
    expect(r1.status()).toBe(200);
    const etag1 = r1.headers()['etag'];
    expect(etag1).toBeTruthy();
    const cc1 = r1.headers()['cache-control'];
    expect(cc1).toBe('private, max-age=0, must-revalidate');

    const r304 = await request.get(url, { headers: { ...headers, 'If-None-Match': etag1! } });
    expect(r304.status()).toBe(304);
    expect(r304.headers()['etag']).toBe(etag1);

    const r2 = await request.get(url, { headers: { ...headers, 'If-None-Match': 'W/"bogus"' } });
    expect(r2.status()).toBe(200);
    expect(r2.headers()['etag']).toBe(etag1);
  });
});