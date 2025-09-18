import { NextRequest } from "next/server";
import { stream as streamLLM } from "@/lib/llm";
import { logRunTelemetry } from "@/lib/telemetry";

// SSE stream endpoint
// GET /api/prompt/stream?model=...&temperature=...&prompt=...&context=...

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model") || "gpt-4o-mini";
  const temperature = parseFloat(searchParams.get("temperature") || "0.7");
  const prompt = searchParams.get("prompt") || "";
  const context = searchParams.get("context") || "";

  if (!prompt.trim()) {
    logRunTelemetry({ kind: "stream", model, ok: false, status: 400, elapsedMs: 0, timestamp: new Date().toISOString(), promptChars: prompt.length, contextChars: context.length });
    return new Response("Prompt is required", { status: 400 });
  }

  const sse = new ReadableStream<any>({
    async start(controller) {
      const started = Date.now();
      let tokensIn: number | undefined = undefined;
      const encoder = new TextEncoder();
      const enqueue = (obj: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        for await (const chunk of streamLLM({ model, temperature, prompt, context })) {
          if (!tokensIn && chunk.type === "start" && typeof chunk.tokensIn === "number") {
            tokensIn = chunk.tokensIn;
          }
          enqueue(chunk);
        }
        controller.close();
        const elapsedMs = Date.now() - started;
        logRunTelemetry({ kind: "stream", model, tokensIn, ok: true, status: 200, elapsedMs, timestamp: new Date().toISOString(), promptChars: prompt.length, contextChars: context.length });
      } catch (err: any) {
        enqueue({ type: "error", message: err?.message || "stream error" });
        try { controller.close(); } catch (e) { void e; }
        const elapsedMs = Date.now() - started;
        logRunTelemetry({ kind: "stream", model, tokensIn, ok: false, status: 500, elapsedMs, timestamp: new Date().toISOString(), promptChars: prompt.length, contextChars: context.length });
      }
    },
  });

  return new Response(sse, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
    status: 200,
  });
}