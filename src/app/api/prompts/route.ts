import { NextRequest } from 'next/server';
import { createPrompt } from '@/lib/db';

export const runtime = 'nodejs';

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function error(status: number, message: string) {
  return json({ error: { message } }, status);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const name = (body?.name ?? '').toString();
  const description = body?.description ?? null;
  const variables = body?.variables;
  const status = body?.status;

  try {
    if (!name || !name.trim()) return error(422, 'name is required');
    if (status && !['draft','public','flagged','removed'].includes(status)) return error(422, 'invalid status');
    if (variables !== undefined && !Array.isArray(variables)) return error(422, 'variables must be an array');

    const created = await createPrompt({ name: name.trim(), description, variables, status });
    return json(created, 201);
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') {
      try {
        const { randomUUID } = await import('crypto');
        const now = new Date().toISOString();
        const devMap: Map<string, any> = (globalThis as any).__DEV_PROMPTS || new Map<string, any>();
        (globalThis as any).__DEV_PROMPTS = devMap;
        const id = randomUUID();
        const prompt = { id, name, description, variables: Array.isArray(variables) ? variables : [], status: status ?? 'draft', score: 0, created_at: now, updated_at: now };
        devMap.set(id, prompt);
        return new Response(JSON.stringify(prompt), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        });
      } catch (err: any) {
        const message = err?.message || e?.message || 'Failed to create prompt';
        return new Response(JSON.stringify({ error: { message } }), { status: 500, headers: { 'content-type': 'application/json' } });
      }
    }
    const message = e?.message || 'Failed to create prompt';
    return new Response(JSON.stringify({ error: { message } }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}