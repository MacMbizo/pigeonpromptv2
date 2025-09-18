// Provider-agnostic LLM service scaffold
// - Defines ModelAdapter interface
// - Provides DevAdapter (deterministic, offline)
// - Central generate() and stream() helpers routing by model prefix

export interface GenerateParams {
  model: string;
  prompt: string;
  context?: string;
  temperature?: number;
}

export interface GenerateResult {
  model: string;
  output: string;
  tokensIn: number;
  tokensOut: number;
}

export interface StreamChunk {
  type: "start" | "delta" | "done";
  text?: string;
  model?: string;
  tokensIn?: number;
}

export interface ModelAdapter {
  // Single-shot generation
  // eslint-disable-next-line no-unused-vars
  generate(params: GenerateParams): Promise<GenerateResult>;
  // Async iterator for streaming deltas
  // eslint-disable-next-line no-unused-vars
  stream(params: GenerateParams): AsyncIterable<StreamChunk>;
  // Optional pricing per 1K tokens
  pricePerKIn?: number;
  pricePerKOut?: number;
  // Capability flags
  supportsStreaming?: boolean;
}

// --- Utilities ---
import { estimateTokens } from "@/lib/token-estimator";

function pickAdapter(model: string): ModelAdapter {
  // Future: route by provider prefix (openai:, claude:, gemini:, etc.)
  // Default to dev adapter for now
  void model;
  return DevAdapter;
}

// Public API
export async function generate(params: GenerateParams): Promise<GenerateResult> {
  const adapter = pickAdapter(params.model);
  // eslint-disable-next-line no-unused-expressions
  void params;
  return adapter.generate(params);
}

export function stream(params: GenerateParams): AsyncIterable<StreamChunk> {
  const adapter = pickAdapter(params.model);
  // eslint-disable-next-line no-unused-expressions
  void params;
  return adapter.stream(params);
}

export function getPricing(model: string): { pricePerKIn: number | null; pricePerKOut: number | null } {
  const adapter = pickAdapter(model);
  return {
    pricePerKIn: typeof adapter.pricePerKIn === "number" ? adapter.pricePerKIn : null,
    pricePerKOut: typeof adapter.pricePerKOut === "number" ? adapter.pricePerKOut : null,
  };
}

// --- Dev Adapter (deterministic, offline) ---
const DevAdapter: ModelAdapter = {
  pricePerKIn: 0,
  pricePerKOut: 0,
  supportsStreaming: true,

  async generate({ model, prompt, context = "", temperature = 0.7 }: GenerateParams): Promise<GenerateResult> {
    const combined = prompt + (context ? `\n\n[context]\n${context}` : "");
    const tokensIn = estimateTokens(combined);
    const prefix = model.includes("claude") ? "(Claude)" : model.includes("gpt") ? "(OpenAI)" : "(LLM)";
    const hash = (prompt.length + context.length + Math.round((isFinite(temperature) ? temperature : 0.7) * 10)) % 97;
    const lines = [
      `- ${prefix} Deterministic response id ${hash}`,
      `- Prompt chars: ${prompt.length}, Ctx chars: ${context.length}`,
      `- Temp: ${isFinite(temperature) ? temperature : 0.7}`,
      `- Tokens in (est): ${tokensIn}`,
    ];
    const output = lines.join("\n");
    const tokensOut = estimateTokens(output);
    return { model, output, tokensIn, tokensOut };
  },

  async *stream({ model, prompt, context = "", temperature = 0.7 }: GenerateParams): AsyncIterable<StreamChunk> {
    const combined = prompt + (context ? `\n\n[context]\n${context}` : "");
    const tokensIn = estimateTokens(combined);
    const prefix = model.includes("claude") ? "(Claude)" : model.includes("gpt") ? "(OpenAI)" : "(LLM)";
    const hash = (prompt.length + context.length + Math.round((isFinite(temperature) ? temperature : 0.7) * 10)) % 97;
    const lines = [
      `- ${prefix} Streaming response id ${hash}`,
      `- Prompt chars: ${prompt.length}, Ctx chars: ${context.length}`,
      `- Temp: ${isFinite(temperature) ? temperature : 0.7}`,
      `- Tokens in (est): ${tokensIn}`,
    ];
    yield { type: "start", model, tokensIn };
    for (let i = 0; i < lines.length; i++) {
      yield { type: "delta", text: lines[i] + (i < lines.length - 1 ? "\n" : "") };
      // small delay between chunks for realism in dev; consumer may buffer
      await new Promise((r) => setTimeout(r, 150));
    }
    yield { type: "done" };
  },
};