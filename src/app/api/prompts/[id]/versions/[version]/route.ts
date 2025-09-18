import { NextRequest } from 'next/server';
import { getPromptVersion, getPromptById } from '@/lib/db';

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function error(status: number, message: string) {
  return json({ error: { message } }, status);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string; version: string } }) {
  try {
    const versionNum = Number(params.version);
    if (!Number.isInteger(versionNum) || versionNum <= 0) return error(422, 'version must be a positive integer');

    // Ensure prompt exists for clearer 404s
    const prompt = await getPromptById(params.id);
    if (!prompt) return error(404, 'Prompt not found');

    const version = await getPromptVersion(params.id, versionNum);
    if (!version) return error(404, 'Version not found');
    return json(version);
  } catch (e: any) {
    const status = Number.isInteger(e?.status) ? e.status : 500;
    const message = e?.message || 'Internal Server Error';
    return error(status, message);
  }
}