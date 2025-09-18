import { test, expect, APIRequestContext } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

async function createUserTemplate(api: APIRequestContext, userId: string, name: string) {
  const res = await api.post(`${APP_URL}/api/templates/user`, {
    data: {
      name,
      description: 'e2e user template',
      system_prompt: 'SYS',
      user_prompt_template: 'Hello, {{name}}',
      variables: [{ key: 'name', label: 'Name' }],
      tags: ['e2e', 'user']
    },
    headers: { 'X-User-Id': userId },
  });
  expect(res.status(), 'create template status').toBe(201);
  const body = await res.json();
  expect(body?.id).toBeTruthy();
  return body;
}

test.describe('User Templates CRUD', () => {
  test('create -> list -> update -> delete', async ({ request }) => {
    const userId = `user-${Date.now()}`;

    // create
    const created = await createUserTemplate(request, userId, `tmpl-${Date.now()}`);

    // list
    const listRes = await request.get(`${APP_URL}/api/templates/user`, { headers: { 'X-User-Id': userId } });
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(Array.isArray(listBody.items)).toBe(true);
    expect(listBody.items.find((t: any) => t.id === created.id)).toBeTruthy();

    // update
    const putRes = await request.put(`${APP_URL}/api/templates/user/${created.id}`, {
      data: { description: 'updated desc', tags: ['e2e', 'updated'] },
      headers: { 'X-User-Id': userId },
    });
    expect(putRes.status()).toBe(200);
    const updated = await putRes.json();
    expect(updated.description).toBe('updated desc');
    expect(updated.tags).toContain('updated');

    // delete
    const delRes = await request.delete(`${APP_URL}/api/templates/user/${created.id}`, {
      headers: { 'X-User-Id': userId },
    });
    expect([200, 404]).toContain(delRes.status());

    // list again -> not found
    const listRes2 = await request.get(`${APP_URL}/api/templates/user`, { headers: { 'X-User-Id': userId } });
    expect(listRes2.status()).toBe(200);
    const listBody2 = await listRes2.json();
    expect(listBody2.items.find((t: any) => t.id === created.id)).toBeFalsy();
  });
});