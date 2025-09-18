import { listSystemTemplates } from '@/lib/templates/system';

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function error(status: number, message: string) {
  return json({ error: { message } }, status);
}

export async function GET() {
  try {
    const items = listSystemTemplates();
    return json({ items, total: items.length });
  } catch (e: any) {
    const status = Number.isInteger(e?.status) ? e.status : 500;
    const message = e?.message || 'Internal Server Error';
    return error(status, message);
  }
}