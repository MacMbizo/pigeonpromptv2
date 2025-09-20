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
  return body as { id: string; updated_at: string };
}

async function getUserTemplates(api: APIRequestContext, userId: string) {
  const res = await api.get(`${APP_URL}/api/templates/user`, { headers: { 'X-User-Id': userId } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  const items = Array.isArray(body) ? body : body.items;
  return items as Array<{ id: string; updated_at: string; name: string; tags?: string[]; description?: string }>; 
}

async function updateUserTemplate(api: APIRequestContext, userId: string, id: string, patch: any, ifMatchUpdatedAt?: string) {
  const res = await api.put(`${APP_URL}/api/templates/user/${id}`, {
    data: patch,
    headers: {
      'X-User-Id': userId,
      ...(ifMatchUpdatedAt ? { 'If-Match': `"${ifMatchUpdatedAt}"` } : {}),
    },
  });
  return res;
}

async function deleteUserTemplate(api: APIRequestContext, userId: string, id: string, ifMatchUpdatedAt?: string) {
  const res = await api.delete(`${APP_URL}/api/templates/user/${id}`, {
    headers: {
      'X-User-Id': userId,
      ...(ifMatchUpdatedAt ? { 'If-Match': `"${ifMatchUpdatedAt}"` } : {}),
    },
  });
  return res;
}


test.describe('User Templates CRUD', () => {
  test('create -> list -> update -> delete', async ({ request }) => {
    const userId = `user-${Date.now()}`;

    // create
    const created = await createUserTemplate(request, userId, `tmpl-${Date.now()}`);

    // list
    const items = await getUserTemplates(request, userId);
    expect(items.find((t) => t.id === created.id)).toBeTruthy();

    // update with If-Match
    const putRes = await updateUserTemplate(request, userId, created.id, { description: 'updated desc', tags: ['e2e', 'updated'] }, created.updated_at);
    expect(putRes.status()).toBe(200);
    const updated = await putRes.json();
    expect(updated.description).toBe('updated desc');
    expect(updated.tags).toContain('updated');

    // delete with If-Match (prefer optimistic concurrency)
    const delRes = await deleteUserTemplate(request, userId, created.id, updated.updated_at || created.updated_at);
    expect([200, 404]).toContain(delRes.status());

    // list again -> not found
    const items2 = await getUserTemplates(request, userId);
    expect(items2.find((t) => t.id === created.id)).toBeFalsy();
  });
});