import { NextRequest } from 'next/server'
import { getPromptById, updatePrompt, softDeletePrompt } from '@/lib/db'
import { matchesIfNone } from '@/lib/http/etag'

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function error(status: number, message: string) {
  return json({ error: { message } }, status)
}

// Dev fallback: return mock prompt when database is unavailable
function getDevFallbackPrompt(id: string) {
  const now = new Date().toISOString()
  return {
    id,
    name: `Sample Prompt ${id.slice(0, 8)}`,
    description: 'This is a sample prompt for development and testing purposes.',
    variables: [
      { name: 'user_input', type: 'string', description: 'User input text' },
      { name: 'context', type: 'string', description: 'Additional context' }
    ],
    status: 'draft' as const,
    score: 85,
    created_at: now,
    updated_at: now,
  }
}

// Prefer stored dev prompt (from POST fallback) if available, else synthesize
function getDevPromptFromStoreOrSynth(id: string) {
  try {
    const glob: any = globalThis as any
    const map: Map<string, any> | undefined = glob.__DEV_PROMPTS
    if (map && map.has(id)) return map.get(id)
  } catch (_err) {
    // Dev store not initialized; fall back to synthetic prompt
  }
  return getDevFallbackPrompt(id)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const prompt = await getPromptById(params.id)
    if (!prompt) {
      if (process.env.NODE_ENV === 'development') {
        // Prefer stored dev prompt if created via POST fallback; else synthesize
        const mockPrompt = getDevPromptFromStoreOrSynth(params.id)
        const mockEtag = `W/"${mockPrompt.id}:${new Date(mockPrompt.updated_at).getTime()}"`
        const ifNoneMatch = req.headers.get('if-none-match')
        if (matchesIfNone(ifNoneMatch, mockEtag)) {
          return new Response(null, {
            status: 304,
            headers: {
              ETag: mockEtag,
              'Cache-Control': 'private, max-age=0, must-revalidate',
              'Last-Modified': new Date(mockPrompt.updated_at).toUTCString(),
            },
          })
        }
        return new Response(JSON.stringify(mockPrompt), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'ETag': mockEtag,
            'Cache-Control': 'private, max-age=0, must-revalidate',
            'Last-Modified': new Date(mockPrompt.updated_at).toUTCString(),
          },
        })
      }
      return error(404, 'Prompt not found')
    }

    const updatedMs = prompt.updated_at ? new Date(prompt.updated_at).getTime() : undefined
    const etag = updatedMs ? `W/"${prompt.id}:${updatedMs}"` : undefined
    const ifNoneMatch = req.headers.get('if-none-match')

    if (etag && matchesIfNone(ifNoneMatch, etag)) {
      return new Response(null, {
        status: 304,
        headers: {
          ...(etag ? { ETag: etag } : {}),
          'Cache-Control': 'private, max-age=0, must-revalidate',
          ...(prompt.updated_at ? { 'Last-Modified': new Date(prompt.updated_at).toUTCString() } : {}),
        },
      })
    }

    return new Response(JSON.stringify(prompt), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        ...(etag ? { ETag: etag } : {}),
        'Cache-Control': 'private, max-age=0, must-revalidate',
        ...(prompt.updated_at ? { 'Last-Modified': new Date(prompt.updated_at).toUTCString() } : {}),
      },
    })
  } catch (e: any) {
    // Dev fallback: if database error in development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[DEV FALLBACK] Database error in GET /api/prompts/${params.id}, returning mock data:`, e?.message)
      const mockPrompt = getDevPromptFromStoreOrSynth(params.id)
      const mockEtag = `W/"${mockPrompt.id}:${new Date(mockPrompt.updated_at).getTime()}"`
      const ifNoneMatch = req.headers.get('if-none-match')
      if (matchesIfNone(ifNoneMatch, mockEtag)) {
        return new Response(null, {
          status: 304,
          headers: {
            ETag: mockEtag,
            'Cache-Control': 'private, max-age=0, must-revalidate',
            'Last-Modified': new Date(mockPrompt.updated_at).toUTCString(),
          },
        })
      }
      return new Response(JSON.stringify(mockPrompt), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'ETag': mockEtag,
          'Cache-Control': 'private, max-age=0, must-revalidate',
          'Last-Modified': new Date(mockPrompt.updated_at).toUTCString(),
        },
      })
    }
    
    const status = Number.isInteger(e?.status) ? e.status : 500
    const message = e?.message || 'Internal Server Error'
    return error(status, message)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const ifMatchHeader = req.headers.get('if-match') || undefined

    const patch: any = {}
    if (body.name !== undefined) {
      const name = (body.name ?? '').toString()
      if (!name.trim()) return error(422, 'name cannot be empty')
      patch.name = name.trim()
    }
    if (body.description !== undefined) patch.description = body.description
    if (body.variables !== undefined) {
      if (!Array.isArray(body.variables)) return error(422, 'variables must be an array')
      patch.variables = body.variables
    }
    if (body.status !== undefined) {
      if (!['draft','public','flagged','removed'].includes(body.status)) return error(422, 'invalid status')
      patch.status = body.status
    }

    const ifMatchUpdatedAt = (body.ifMatchUpdatedAt ?? ifMatchHeader) || undefined
    if (ifMatchUpdatedAt) patch.ifMatchUpdatedAt = ifMatchUpdatedAt

    const updated = await updatePrompt(params.id, patch)
    return json(updated)
  } catch (e: any) {
    // Dev in-memory fallback for PATCH when DB unavailable
    if (process.env.NODE_ENV === 'development') {
      try {
        const body = await req.json().catch(() => ({}))
        const ifMatchHeader = req.headers.get('if-match') || undefined
        const ifMatchUpdatedAt = (body.ifMatchUpdatedAt ?? ifMatchHeader) || undefined
        const glob: any = globalThis as any
        glob.__DEV_PROMPTS = glob.__DEV_PROMPTS || new Map<string, any>()
        const map: Map<string, any> = glob.__DEV_PROMPTS
        const existing = map.get(params.id)
        if (!existing) return error(404, 'Not found')
        if (ifMatchUpdatedAt && ifMatchUpdatedAt !== existing.updated_at) {
          return error(409, 'Precondition failed')
        }
        const fields: any = {}
        if (body.name !== undefined) {
          const name = (body.name ?? '').toString()
          if (!name.trim()) return error(422, 'name cannot be empty')
          fields.name = name.trim()
        }
        if (body.description !== undefined) fields.description = body.description
        if (body.variables !== undefined) {
          if (!Array.isArray(body.variables)) return error(422, 'variables must be an array')
          fields.variables = body.variables
        }
        if (body.status !== undefined) {
          if (!['draft','public','flagged','removed'].includes(body.status)) return error(422, 'invalid status')
          fields.status = body.status
        }
        const now = new Date().toISOString()
        const updated = { ...existing, ...fields, updated_at: now }
        map.set(params.id, updated)
        return json(updated)
      } catch (ie: any) {
        const status = Number.isInteger(ie?.status) ? ie.status : 500
        const message = ie?.message || 'Internal Server Error'
        return error(status, message)
      }
    }

    const status = Number.isInteger(e?.status) ? e.status : 500
    const message = e?.message || 'Internal Server Error'
    return error(status, message)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const ifMatchHeader = req.headers.get('if-match') || undefined
    const ifMatchUpdatedAt = (body.ifMatchUpdatedAt ?? ifMatchHeader) || undefined

    const deleted = await softDeletePrompt(params.id, ifMatchUpdatedAt)
    return json(deleted)
  } catch (e: any) {
    const status = Number.isInteger(e?.status) ? e.status : 500
    const message = e?.message || 'Internal Server Error'
    return error(status, message)
  }
}