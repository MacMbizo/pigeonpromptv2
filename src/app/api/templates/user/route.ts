import { NextRequest } from 'next/server';
import { getUserTemplates, createTemplate } from '@/lib/db';
import { matchesIfNone } from '@/lib/http/etag';
import { devCreateTemplate, devGetTemplates } from '@/lib/dev/templates-store';

// Prefer dev in-memory store during development when no DB URLs are configured
const shouldUseDevStore = process.env.NODE_ENV === 'development' && !(process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL);

function json(data: any, init: number | { status?: number; headers?: Record<string, string> } = 200) {
  const status = typeof init === 'number' ? init : init?.status ?? 200;
  const extraHeaders = typeof init === 'object' && (init as any)?.headers ? (init as any).headers : undefined;
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(extraHeaders || {}) },
  });
}

function error(message: string, status = 500) {
  return json({ error: { message } }, status);
}

function getUserId(req: NextRequest): string | null {
  const id = req.headers.get('x-user-id') || req.headers.get('X-User-Id') || req.headers.get('x-userid');
  if (id) return id;
  const { searchParams } = new URL(req.url);
  const qp = searchParams.get('userId');
  return qp || null;
}

// moved to '@/lib/http/etag'

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return error('Missing user id', 401);

    let templates: any[] = [];
    if (shouldUseDevStore) {
      // When no DB configured in dev, read from in-memory store to keep behavior consistent with POST
      templates = devGetTemplates(userId);
    } else {
      try {
        templates = await getUserTemplates(userId);
      } catch (dbErr: any) {
        if (process.env.NODE_ENV === 'development') {
          // Graceful dev fallback: use in-memory store to support E2E without DB
          templates = devGetTemplates(userId);
        } else {
          throw dbErr;
        }
      }
    }

    const maxUpdatedAt = templates.reduce<string | null>((acc, t: any) => {
      const u = t?.updated_at;
      if (!u) return acc;
      if (!acc) return u;
      return new Date(u) > new Date(acc) ? u : acc;
    }, null);

    // Weak ETag derived from count and latest update timestamp (no Buffer to support Edge runtime)
    const latestMs = maxUpdatedAt ? new Date(maxUpdatedAt).getTime() : 0;
    const etag = `W/"${templates.length}:${latestMs}"`;
    const ifNoneMatch = req.headers.get('if-none-match');

    if (ifNoneMatch === etag || matchesIfNone(ifNoneMatch, etag)) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'private, max-age=0, must-revalidate',
          ...(maxUpdatedAt ? { 'Last-Modified': new Date(maxUpdatedAt).toUTCString() } : {}),
        },
      });
    }

    return json(
      { items: templates, total: templates.length },
      {
        status: 200,
        headers: {
          ETag: etag,
          'Cache-Control': 'private, max-age=0, must-revalidate',
          ...(maxUpdatedAt ? { 'Last-Modified': new Date(maxUpdatedAt).toUTCString() } : {}),
        },
      }
    );
  } catch (e: any) {
    // As a final guard, return a dev-friendly empty list on errors in development
    if (process.env.NODE_ENV === 'development') {
      const etag = 'W/"0:0"';
      return json(
        { items: [], total: 0 },
        {
          status: 200,
          headers: { ETag: etag, 'Cache-Control': 'private, max-age=0, must-revalidate' },
        }
      );
    }
    const status = e?.status ?? 500;
    return error(e?.message || 'Internal Server Error', status);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return error('Missing user id', 401);
    const body = await req.json();

    let created: any;
    try {
      created = await createTemplate(userId, body || {});
    } catch (dbErr: any) {
      if (process.env.NODE_ENV === 'development') {
        created = devCreateTemplate(userId, body || {});
      } else {
        throw dbErr;
      }
    }

    const updatedMs = created?.updated_at ? new Date(created.updated_at).getTime() : 0;
    const etag = created?.id ? `W/"${created.id}:${updatedMs}"` : 'W/"0:0"';

    return json(created, {
      status: 201,
      headers: {
        ETag: etag,
        'Cache-Control': 'private, max-age=0, must-revalidate',
        ...(created?.updated_at ? { 'Last-Modified': new Date(created.updated_at).toUTCString() } : {}),
      },
    });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return error(e?.message || 'Internal Server Error', status);
  }
}
