import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We'll dynamically import the route after setting NODE_ENV and mocks for each test case

function makeReq(headersInit: Record<string, string> = {}) {
  const headers = new Headers(headersInit);
  return { headers } as any; // minimal shape used by our route handlers
}

const devTemplatesSample = [
  {
    id: 'dev-t1',
    user_id: 'u1',
    name: 'Sample',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Keep original env to restore after tests
// const ORIGINAL_ENV = { ...process.env };

describe('NODE_ENV guards around dev fallbacks (templates user GET)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    // process.env = { ...ORIGINAL_ENV };
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('uses dev fallback when DB fails in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    // Mock DB to throw and dev store to return a sample
    vi.doMock('@/lib/db', () => ({
      getUserTemplates: vi.fn().mockRejectedValue(Object.assign(new Error('DB down'), { status: 503 })),
      createTemplate: vi.fn(),
    }));
    const devStore = { devGetTemplates: vi.fn().mockReturnValue(devTemplatesSample) };
    vi.doMock('@/lib/dev/templates-store', () => devStore);

    const { GET } = await import('@/app/api/templates/user/route');

    const res = await GET(makeReq({ 'x-user-id': 'u1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ items: devTemplatesSample, total: devTemplatesSample.length });

    // Ensure the dev fallback was used
    expect(devStore.devGetTemplates).toHaveBeenCalledWith('u1');
  });

  it('does NOT use dev fallback when DB fails in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    // Mock DB to throw; dev store should not be used
    vi.doMock('@/lib/db', () => ({
      getUserTemplates: vi.fn().mockRejectedValue(Object.assign(new Error('DB down'), { status: 503 })),
      createTemplate: vi.fn(),
    }));
    const devStore = { devGetTemplates: vi.fn().mockReturnValue(devTemplatesSample) };
    vi.doMock('@/lib/dev/templates-store', () => devStore);

    const { GET } = await import('@/app/api/templates/user/route');

    const res = await GET(makeReq({ 'x-user-id': 'u1' }));
    // The route should surface the DB error (status from thrown error or 500 fallback)
    expect([500, 503]).toContain(res.status);

    // Dev fallback must not be used in production
    expect(devStore.devGetTemplates).not.toHaveBeenCalled();
  });
});