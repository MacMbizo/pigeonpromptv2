import { NextRequest, NextResponse } from "next/server";
import { estimateCost } from "@/lib/token-estimator";
import { generate, getPricing } from "@/lib/llm";
import { logRunTelemetry } from "@/lib/telemetry";

// POST /api/prompt/run
// Body: { model: string, temperature?: number, prompt: string, context?: string }
// Returns: { model, output, tokensIn, tokensOut, cost, elapsedMs }

export async function POST(req: NextRequest) {
  const started = Date.now();
  try {
    const body = await req.json();
    const model = (body?.model as string) || "gpt-4o-mini";
    const temperature = typeof body?.temperature === "number" ? body.temperature : 0.7;
    const prompt = (body?.prompt as string) || "";
    const context = (body?.context as string) || "";

    if (!prompt.trim()) {
      const elapsedMs = Date.now() - started;
      logRunTelemetry({
        kind: "run",
        model,
        ok: false,
        status: 400,
        elapsedMs,
        timestamp: new Date().toISOString(),
        promptChars: prompt.length,
        contextChars: context.length,
      });
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const { output, tokensIn, tokensOut } = await generate({ model, prompt, context, temperature });

    // Compute cost from adapter pricing (per 1K tokens)
    const { pricePerKIn, pricePerKOut } = getPricing(model);
    const costIn = pricePerKIn != null ? estimateCost(tokensIn, pricePerKIn) : null;
    const costOut = pricePerKOut != null ? estimateCost(tokensOut, pricePerKOut) : null;
    const cost = costIn !== null && costOut !== null ? Number(((costIn ?? 0) + (costOut ?? 0)).toFixed(6)) : null;

    const elapsedMs = Date.now() - started;

    logRunTelemetry({
      kind: "run",
      model,
      tokensIn,
      tokensOut,
      cost,
      elapsedMs,
      ok: true,
      status: 200,
      timestamp: new Date().toISOString(),
      promptChars: prompt.length,
      contextChars: context.length,
    });

    return NextResponse.json({ model, output, tokensIn, tokensOut, cost, elapsedMs });
  } catch (err: any) {
    const elapsedMs = Date.now() - started;
    // Use model from request if available for error telemetry
    try {
      const body = await req.json();
      const model = (body?.model as string) || "unknown";
      const prompt = (body?.prompt as string) || "";
      const context = (body?.context as string) || "";
      logRunTelemetry({
        kind: "run",
        model,
        ok: false,
        status: 500,
        elapsedMs,
        timestamp: new Date().toISOString(),
        promptChars: prompt.length,
        contextChars: context.length,
      });
    } catch (e) { void e; }
    return NextResponse.json({ error: err?.message || "Unexpected error", elapsedMs }, { status: 500 });
  }
}