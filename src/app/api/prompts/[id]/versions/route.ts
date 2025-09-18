import { NextRequest } from 'next/server';
import { listPromptVersions, createPromptVersion, getPromptById } from '@/lib/db';

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function error(status: number, message: string) {
  return json({ error: { message } }, status);
}

function devMockVersions(promptId: string) {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  return [
    {
      id: `${promptId}-v2`,
      prompt_id: promptId,
      version: 2,
      content: 'Hello {{user_input}}\n\nUse context: {{context}}',
      model_targets: ['gpt-4o-mini', 'claude-3-haiku'],
      changelog: 'Refined greeting and added context slot',
      created_at: iso(new Date(now.getTime() - 1000 * 60 * 60)),
    },
    {
      id: `${promptId}-v1`,
      prompt_id: promptId,
      version: 1,
      content: 'Hello {{user_input}}',
      model_targets: ['gpt-4o-mini'],
      changelog: 'Initial version',
      created_at: iso(new Date(now.getTime() - 1000 * 60 * 60 * 2)),
    },
  ];
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Ensure prompt exists for clearer 404s; in development, return mock versions when missing
    const prompt = await getPromptById(params.id);
    if (!prompt) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[DEV FALLBACK] GET /api/prompts/${params.id}/versions prompt not found; returning mock versions`);
        return json({ items: devMockVersions(params.id) });
      }
      return error(404, 'Prompt not found');
    }

    const versions = await listPromptVersions(params.id);
    return json({ items: versions });
  } catch (e: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[DEV FALLBACK] GET /api/prompts/${params.id}/versions failed, returning mock versions:`, e?.message);
      return json({ items: devMockVersions(params.id) });
    }
    const status = Number.isInteger(e?.status) ? e.status : 500;
    const message = e?.message || 'Internal Server Error';
    return error(status, message);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const content = (body?.content ?? '').toString();
    const changelog = body?.changelog ?? null;
    const model_targets = Array.isArray(body?.model_targets) ? body.model_targets : (body?.model_targets === undefined ? undefined : null);

    if (!content.trim()) return error(422, 'content is required');
    if (model_targets === null) return error(422, 'model_targets must be an array if provided');

    // Ensure prompt exists; in development, synthesize a created version when missing instead of 404
    const prompt = await getPromptById(params.id);
    if (!prompt) {
      if (process.env.NODE_ENV === 'development') {
        const { randomUUID } = await import('crypto');
        const mock = {
          id: `${params.id}-v${randomUUID().slice(0, 8)}`,
          prompt_id: params.id,
          version: 999,
          content: content.trim(),
          model_targets: Array.isArray(model_targets) ? model_targets : [],
          changelog,
          created_at: new Date().toISOString(),
        };
        console.warn(`[DEV FALLBACK] POST /api/prompts/${params.id}/versions prompt not found; returning mock created version`);
        return json(mock, 201);
      }
      return error(404, 'Prompt not found');
    }

    const created = await createPromptVersion(params.id, { content: content.trim(), changelog, model_targets });
    return json(created, 201);
  } catch (e: any) {
    if (process.env.NODE_ENV === 'development') {
      // In dev fallback, accept the POST and synthesize a response without persisting
      const body = await req.json().catch(() => ({}));
      const content = (body?.content ?? '').toString().trim();
      const changelog = body?.changelog ?? null;
      const model_targets = Array.isArray(body?.model_targets) ? body.model_targets : [];
      if (!content) return error(422, 'content is required');
      const mock = {
        id: `${params.id}-v${Math.floor(Math.random() * 1000)}`,
        prompt_id: params.id,
        version: 999,
        content,
        model_targets,
        changelog,
        created_at: new Date().toISOString(),
      };
      console.warn(`[DEV FALLBACK] POST /api/prompts/${params.id}/versions failed, returning mock created version`);
      return json(mock, 201);
    }
    const status = Number.isInteger(e?.status) ? e.status : 500;
    const message = e?.message || 'Internal Server Error';
    return error(status, message);
  }
}