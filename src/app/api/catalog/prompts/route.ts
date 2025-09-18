import { NextRequest, NextResponse } from 'next/server';
import { getPublicPrompts, type PromptSort } from '@/lib/db';
import { matchesIfNone } from '@/lib/http/etag';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)));
  const sort = (searchParams.get('sort') as PromptSort) || 'score_desc';

  // tags: support repeated ?tag= and comma-separated ?tags=
  const tagsRepeated = searchParams.getAll('tag');
  const tagsCsv = (searchParams.get('tags') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = Array.from(new Set([...(tagsRepeated || []), ...tagsCsv]));

  // Attempt fetch; on DB down, gracefully return empty catalog
  let items: any[] = [];
  let total = 0;
  let hasMore = false;
  let maxUpdatedAt: string | null = null;
  let dbStatus: 'up' | 'down' = 'up';

  try {
    const res = await getPublicPrompts({ q, page, size, sort, tags: tags.length ? tags : undefined });
    items = res.items;
    total = res.total;
    hasMore = page * size < total;
    maxUpdatedAt = items.reduce<string | null>((acc, it) => {
      if (!it?.updated_at) return acc;
      if (!acc) return it.updated_at;
      return new Date(it.updated_at) > new Date(acc) ? it.updated_at : acc;
    }, null);
  } catch (e: any) {
    dbStatus = 'down';
    // keep items empty and total 0; proceed to build response with fallback
    // In development, surface items from in-memory dev store if available
    if (process.env.NODE_ENV !== 'production') {
      try {
        const devMap: Map<string, any> | undefined = (globalThis as any).__DEV_PROMPTS;
        if (devMap && devMap.size) {
          let arr = Array.from(devMap.values()).filter((p) => p && p.status === 'public');
          // simple q filter on name/description
          if (q && q.trim()) {
            const qq = q.trim().toLowerCase();
            arr = arr.filter((p) =>
              (p.name || '').toLowerCase().includes(qq) || (p.description || '').toLowerCase().includes(qq)
            );
          }
          // sort
          const sortKey = sort || 'score_desc';
          arr.sort((a, b) => {
            switch (sortKey) {
              case 'created_desc':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              case 'created_asc':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              case 'name_asc':
                return String(a.name).localeCompare(String(b.name));
              case 'name_desc':
                return String(b.name).localeCompare(String(a.name));
              case 'score_desc':
              default:
                return (b.score ?? 0) - (a.score ?? 0) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }
          });
          total = arr.length;
          const start = Math.max(0, (page - 1) * size);
          const pageItems = arr.slice(start, start + size);
          items = pageItems.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            score: p.score ?? 0,
            created_at: p.created_at,
            updated_at: p.updated_at,
          }));
          hasMore = start + items.length < total;
          maxUpdatedAt = arr.reduce<string | null>((acc, it) => {
            if (!it?.updated_at) return acc;
            if (!acc) return it.updated_at;
            return new Date(it.updated_at) > new Date(acc) ? it.updated_at : acc;
          }, null);
        }
      } catch (_e) {
        // Ignore dev fallback population errors; keep items empty
      }
      console.warn('[catalog] DB unavailable, serving dev in-memory catalog fallback:', e?.code || e?.message || e);
    }
  }

  const etagPayload = JSON.stringify({ q, page, size, sort, tags, total, maxUpdatedAt });
  const etag = `W/"${Buffer.from(etagPayload).toString('base64')}"`;
  const ifNoneMatch = req.headers.get('if-none-match');

  if (ifNoneMatch === etag || matchesIfNone(ifNoneMatch, etag)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'public, max-age=0, must-revalidate',
        ...(maxUpdatedAt ? { 'Last-Modified': new Date(maxUpdatedAt).toUTCString() } : {}),
        'X-DB-Status': dbStatus,
      },
    });
  }

  return NextResponse.json(
    { items, page, size, total, hasMore, sort },
    {
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        ETag: etag,
        ...(maxUpdatedAt ? { 'Last-Modified': new Date(maxUpdatedAt).toUTCString() } : {}),
        'X-DB-Status': dbStatus,
      },
    }
  );
}