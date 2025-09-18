import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { matchesIfNone } from '@/lib/http/etag'

// Existing tests for matchesIfNone

describe('matchesIfNone', () => {
  it('returns false when inputs are null/undefined', () => {
    expect(matchesIfNone(null as any, 'W/"etag"')).toBe(false)
    expect(matchesIfNone(undefined as any, 'W/"etag"')).toBe(false)
    expect(matchesIfNone('', 'W/"etag"')).toBe(false)
  })

  it('normalizes weak tags and compares correctly', () => {
    expect(matchesIfNone('W/"abc"', 'W/"abc"')).toBe(true)
    expect(matchesIfNone('"abc"', 'W/"abc"')).toBe(true)
    expect(matchesIfNone('W/"abc"', '"abc"')).toBe(true)
  })

  it('supports comma-separated ETag lists and trims whitespace', () => {
    expect(matchesIfNone('W/"one", W/"two"', 'W/"two"')).toBe(true)
    expect(matchesIfNone('  W/"one"  ,  W/"two"  ', 'W/"two"')).toBe(true)
  })

  it('returns false if no values match', () => {
    expect(matchesIfNone('W/"one", W/"two"', 'W/"three"')).toBe(false)
  })

  it('treats wildcard * as match', () => {
    expect(matchesIfNone('*', 'W/"anything"')).toBe(true)
  })
})

describe('templates user route headers', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    // Default to test env; route only uses NODE_ENV for dev fallbacks on errors, which we do not trigger here
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('GET returns 304 with matching If-None-Match and correct headers', async () => {
    vi.mock('@/lib/db', () => ({
      getUserTemplates: vi.fn(),
      createTemplate: vi.fn(),
    }))

    const { getUserTemplates } = await import('@/lib/db') as any
    const updatedAt = '2024-01-01T00:00:00.000Z'
    const templates = [
      { id: 't1', updated_at: updatedAt },
    ]
    getUserTemplates.mockResolvedValue(templates)

    const { GET } = await import('@/app/api/templates/user/route')

    const latestMs = new Date(updatedAt).getTime()
    const expectedEtag = `W/"${templates.length}:${latestMs}"`

    const headers = new Headers({ 'x-user-id': 'u1', 'if-none-match': expectedEtag })
    const res = await GET({ headers } as any)

    expect(res.status).toBe(304)
    expect(res.headers.get('etag')).toBe(expectedEtag)
    expect(res.headers.get('cache-control')).toBe('private, max-age=0, must-revalidate')
    expect(res.headers.get('last-modified')).toBe(new Date(updatedAt).toUTCString())
  })

  it('GET returns 200 with body and headers when If-None-Match does not match', async () => {
    vi.mock('@/lib/db', () => ({
      getUserTemplates: vi.fn(),
      createTemplate: vi.fn(),
    }))

    const { getUserTemplates } = await import('@/lib/db') as any
    const updatedAt = '2024-01-01T00:00:00.000Z'
    const templates = [
      { id: 't1', updated_at: updatedAt },
    ]
    getUserTemplates.mockResolvedValue(templates)

    const { GET } = await import('@/app/api/templates/user/route')

    const latestMs = new Date(updatedAt).getTime()
    const expectedEtag = `W/"${templates.length}:${latestMs}"`

    const headers = new Headers({ 'x-user-id': 'u1', 'if-none-match': 'W/"bogus"' })
    const res = await GET({ headers } as any)

    expect(res.status).toBe(200)
    expect(res.headers.get('etag')).toBe(expectedEtag)
    expect(res.headers.get('cache-control')).toBe('private, max-age=0, must-revalidate')
    expect(res.headers.get('last-modified')).toBe(new Date(updatedAt).toUTCString())

    const body = await res.json()
    expect(body).toEqual({ items: templates, total: templates.length })
  })

  it('POST returns 201 with correct ETag and headers', async () => {
    vi.mock('@/lib/db', () => ({
      getUserTemplates: vi.fn(),
      createTemplate: vi.fn(),
    }))

    const { createTemplate } = await import('@/lib/db') as any
    const updatedAt = '2024-01-02T00:00:00.000Z'
    const created = { id: 't1', updated_at: updatedAt, name: 'X' }
    createTemplate.mockResolvedValue(created)

    const { POST } = await import('@/app/api/templates/user/route')

    const updatedMs = new Date(updatedAt).getTime()
    const expectedEtag = `W/"${created.id}:${updatedMs}"`

    const headers = new Headers({ 'x-user-id': 'u1' })
    const req = { headers, json: async () => ({ name: 'X' }) } as any
    const res = await POST(req)

    expect(res.status).toBe(201)
    expect(res.headers.get('etag')).toBe(expectedEtag)
    expect(res.headers.get('cache-control')).toBe('private, max-age=0, must-revalidate')
    expect(res.headers.get('last-modified')).toBe(new Date(updatedAt).toUTCString())

    const body = await res.json()
    expect(body).toEqual(created)
  })

  // New tests: ensure query parameter fallback for userId works when header is absent
  it('GET accepts userId via query parameter when header is absent', async () => {
    vi.mock('@/lib/db', () => ({
      getUserTemplates: vi.fn(),
      createTemplate: vi.fn(),
    }))

    const { getUserTemplates } = await import('@/lib/db') as any
    const updatedAt = '2024-01-03T00:00:00.000Z'
    const templates = [ { id: 't2', updated_at: updatedAt } ]
    getUserTemplates.mockResolvedValue(templates)

    const { GET } = await import('@/app/api/templates/user/route')

    const url = 'http://localhost/api/templates/user?userId=u_qp'
    const headers = new Headers() // no x-user-id header

    const res = await GET({ url, headers } as any)

    const latestMs = new Date(updatedAt).getTime()
    const expectedEtag = `W/"${templates.length}:${latestMs}"`

    expect(res.status).toBe(200)
    expect(res.headers.get('etag')).toBe(expectedEtag)
    const body = await res.json()
    expect(body).toEqual({ items: templates, total: templates.length })
  })

  it('POST accepts userId via query parameter when header is absent', async () => {
    vi.mock('@/lib/db', () => ({
      getUserTemplates: vi.fn(),
      createTemplate: vi.fn(),
    }))

    const { createTemplate } = await import('@/lib/db') as any
    const updatedAt = '2024-01-04T00:00:00.000Z'
    const created = { id: 't3', updated_at: updatedAt, name: 'Y' }
    createTemplate.mockResolvedValue(created)

    const { POST } = await import('@/app/api/templates/user/route')

    const url = 'http://localhost/api/templates/user?userId=u_qp'
    const headers = new Headers() // no x-user-id header
    const req = { url, headers, json: async () => ({ name: 'Y' }) } as any

    const res = await POST(req)

    const updatedMs = new Date(updatedAt).getTime()
    const expectedEtag = `W/"${created.id}:${updatedMs}"`

    expect(res.status).toBe(201)
    expect(res.headers.get('etag')).toBe(expectedEtag)
    const body = await res.json()
    expect(body).toEqual(created)
  })
})