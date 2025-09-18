import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

// Helper to reload module with fresh env and clean state
async function loadTelemetry() {
  vi.resetModules();
  return await import('@/lib/telemetry');
}

function resetBuffer() {
  (globalThis as any).__pigeonTelemetryBuffer = [];
}

describe('telemetry buffer', () => {
  beforeEach(() => {
    resetBuffer();
  });

  afterEach(() => {
    resetBuffer();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('caps the buffer at 500 events (keeps most recent)', async () => {
    vi.stubEnv('PIGEON_TELEMETRY_DISABLED', '0');
    vi.stubEnv('NODE_ENV', 'test');
    const { logRunTelemetry, getTelemetryBuffer } = await loadTelemetry();
    for (let i = 0; i < 510; i++) {
      logRunTelemetry({ kind: 'run', model: 'dev', ok: true, timestamp: new Date().toISOString(), status: 200, promptChars: 1, contextChars: 0, tokensIn: i, tokensOut: 0, elapsedMs: 1 });
    }
    const buf = getTelemetryBuffer();
    expect(buf.length).toBeLessThanOrEqual(500);
    expect(buf.at(-1)?.tokensIn).toBe(509);
  });

  it('respects hard disable flag and does not log or buffer', async () => {
    vi.stubEnv('PIGEON_TELEMETRY_DISABLED', '1');
    vi.stubEnv('NODE_ENV', 'test');
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { logRunTelemetry, getTelemetryBuffer } = await loadTelemetry();
    logRunTelemetry({ kind: 'run', model: 'dev', ok: true, timestamp: new Date().toISOString(), status: 200 });
    expect(getTelemetryBuffer().length).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits to console when enabled in non-production', async () => {
    vi.stubEnv('PIGEON_TELEMETRY_DISABLED', '0');
    vi.stubEnv('NODE_ENV', 'test');
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { logRunTelemetry } = await loadTelemetry();
    logRunTelemetry({ kind: 'run', model: 'dev', ok: true, timestamp: new Date().toISOString(), status: 200 });
    expect(spy).toHaveBeenCalledTimes(1);
    const [tag, payload] = spy.mock.calls[0];
    expect(tag).toBe('[telemetry]');
    const obj = JSON.parse(String(payload));
    expect(obj).toHaveProperty('kind');
    expect(obj).toHaveProperty('model');
    expect(obj).toHaveProperty('ok');
    expect(obj).toHaveProperty('timestamp');
    expect(obj).not.toHaveProperty('prompt');
    expect(obj).not.toHaveProperty('context');
  });

  it('can force console on in production via TELEMETRY_CONSOLE=1 (but buffer still disabled in prod)', async () => {
    // In production, hard disable should short-circuit everything regardless of console flag
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TELEMETRY_CONSOLE', '1');
    vi.stubEnv('PIGEON_TELEMETRY_DISABLED', '1');
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { logRunTelemetry, getTelemetryBuffer } = await loadTelemetry();
    logRunTelemetry({ kind: 'run', model: 'dev', ok: true, timestamp: new Date().toISOString(), status: 200 });
    expect(getTelemetryBuffer().length).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });
});