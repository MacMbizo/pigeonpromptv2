import { getDbRuntimeStatus, pingDb } from '@/lib/db';

export async function GET() {
  try {
    const status = getDbRuntimeStatus();
    const ping = await pingDb();
    return Response.json({ ok: true, status, ping });
  } catch (err: any) {
    console.error('GET /api/status/db error:', err);
    return new Response(JSON.stringify({ ok: false, error: { message: err?.message || 'Internal Server Error' } }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}