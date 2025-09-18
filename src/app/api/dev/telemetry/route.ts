import { NextResponse } from 'next/server';
import { getTelemetryBuffer } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Dev-only endpoint; do not expose in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  const items = getTelemetryBuffer().map((e) => ({
    kind: e.kind,
    model: e.model,
    tokensIn: e.tokensIn ?? null,
    tokensOut: e.tokensOut ?? null,
    cost: e.cost ?? null,
    elapsedMs: e.elapsedMs ?? null,
    promptChars: e.promptChars ?? null,
    contextChars: e.contextChars ?? null,
    ok: e.ok,
    status: e.status ?? null,
    timestamp: e.timestamp,
  }));
  return NextResponse.json({ items, count: items.length, now: new Date().toISOString() }, { headers: { 'cache-control': 'no-store' } });
}