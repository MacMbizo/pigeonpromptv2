// Lightweight telemetry helper with dev-safe no-op fallback
// Captures prompt run metrics (no prompt/context contents)

export type RunTelemetryEvent = {
  kind: "run" | "stream";
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number | null;
  elapsedMs?: number;
  promptChars?: number;
  contextChars?: number;
  ok: boolean;
  status?: number;
  // ISO timestamp
  timestamp: string;
};

const MAX_BUFFER = 500;

function getBuffer(): RunTelemetryEvent[] {
  const g = globalThis as any;
  if (!g.__pigeonTelemetryBuffer) {
    g.__pigeonTelemetryBuffer = [] as RunTelemetryEvent[];
  }
  return g.__pigeonTelemetryBuffer as RunTelemetryEvent[];
}

function pushToBuffer(ev: RunTelemetryEvent) {
  try {
    const buf = getBuffer();
    buf.push(ev);
    if (buf.length > MAX_BUFFER) buf.splice(0, buf.length - MAX_BUFFER);
  } catch (e) { void e; }
}

const TELEMETRY_DISABLED = process.env.PIGEON_TELEMETRY_DISABLED === "1" || process.env.NODE_ENV === "production";
const CONSOLE_ENABLED = (process.env.TELEMETRY_CONSOLE === "1" || process.env.NODE_ENV !== "production") && !TELEMETRY_DISABLED;

export function logRunTelemetry(event: RunTelemetryEvent): void {
  try {
    if (TELEMETRY_DISABLED) return;
    pushToBuffer(event);
    if (CONSOLE_ENABLED) {
      // Intentionally avoid logging prompt/context contents; only metadata
      // Use a recognizable tag for easy grepping in dev logs
      // eslint-disable-next-line no-console
      console.info("[telemetry]", JSON.stringify(event));
    }
  } catch (e) { void e; }
}

export function getTelemetryBuffer(): RunTelemetryEvent[] {
  return [...getBuffer()];
}