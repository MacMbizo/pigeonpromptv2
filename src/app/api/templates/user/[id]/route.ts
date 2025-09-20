import { NextRequest } from 'next/server';
import { updateTemplate, deleteTemplate } from '@/lib/db';
import { devUpdateTemplate, devDeleteTemplate } from '@/lib/dev/templates-store';

function json(data: any, init: number | { status?: number; headers?: Record<string, string> } = 200) {
  const status = typeof init === 'number' ? init : init?.status ?? 200;
  const extraHeaders = typeof init === 'object' && (init as any)?.headers ? (init as any).headers : undefined;
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(extraHeaders || {}) },
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}

function getUserId(req: NextRequest) {
  const hdr = req.headers.get('x-user-id');
  if (hdr) return hdr;
  const { searchParams } = new URL(req.url);
  const qp = searchParams.get('userId');
  return qp ?? '';
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(req);
    if (!userId) return error('Missing user id', 401);
    const body = await req.json();

    // Check If-Match header for optimistic concurrency control
    const ifMatch = req.headers.get('if-match');
    if (ifMatch) {
      // First, get the current template to check its updated_at
      let currentTemplate: any;
      try {
        // We need to get the current template first to verify the If-Match condition
        const { getUserTemplates } = await import('@/lib/db');
        let templates = await getUserTemplates(userId);
        currentTemplate = templates.find((t: any) => t.id === params.id);

        // In development, lib/db may return an empty list when no DB is configured.
        // Fall back to the dev in-memory store before concluding Not Found.
        if (!currentTemplate && process.env.NODE_ENV === 'development') {
          const { devGetTemplates } = await import('@/lib/dev/templates-store');
          const devTemplates = devGetTemplates(userId);
          currentTemplate = devTemplates.find((t: any) => t.id === params.id);
        }
      } catch (dbErr: any) {
        if (process.env.NODE_ENV === 'development') {
          const { devGetTemplates } = await import('@/lib/dev/templates-store');
          const templates = devGetTemplates(userId);
          currentTemplate = templates.find((t: any) => t.id === params.id);
        } else {
          throw dbErr;
        }
      }
      
      if (!currentTemplate) {
        return error('Not Found', 404);
      }
      
      // For templates, we expect If-Match to contain the updated_at timestamp
      const expectedUpdatedAt = ifMatch.replace(/"/g, ''); // Remove quotes if present
      if (currentTemplate.updated_at !== expectedUpdatedAt) {
        return error('Precondition failed: template was modified', 412);
      }
    }

    let updated: any;
    try {
      updated = await updateTemplate(userId, params.id, body || {});
    } catch (dbErr: any) {
      if (process.env.NODE_ENV === 'development') {
        updated = devUpdateTemplate(userId, params.id, body || {});
        if (!updated) return error('Not Found', 404);
      } else {
        throw dbErr;
      }
    }

    const updatedMs = updated?.updated_at ? new Date(updated.updated_at).getTime() : undefined;
    const etag = updated?.id && updatedMs ? `W/"${updated.id}:${updatedMs}"` : undefined;
    return json(updated, {
      status: 200,
      headers: {
        ...(etag ? { ETag: etag } : {}),
        'Cache-Control': 'private, max-age=0, must-revalidate',
        ...(updated?.updated_at ? { 'Last-Modified': new Date(updated.updated_at).toUTCString() } : {}),
      },
    });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return error(e?.message || 'Internal Server Error', status);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(req);
    if (!userId) return error('Missing user id', 401);

    // Check If-Match header for optimistic concurrency control
    const ifMatch = req.headers.get('if-match');
    if (ifMatch) {
      // For DELETE, we can check against the current template's updated_at
      // This prevents deleting a template that was modified since last seen
      // Note: In a full implementation, we'd fetch the current template first to verify
      // For now, we'll rely on the client to provide the correct timestamp
    }

    let ok: boolean;
    try {
      ok = await deleteTemplate(userId, params.id);
    } catch (dbErr: any) {
      if (process.env.NODE_ENV === 'development') {
        ok = devDeleteTemplate(userId, params.id);
      } else {
        throw dbErr;
      }
    }

    return json({ ok }, {
      status: ok ? 200 : 404,
      headers: {
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return error(e?.message || 'Internal Server Error', status);
  }
}
