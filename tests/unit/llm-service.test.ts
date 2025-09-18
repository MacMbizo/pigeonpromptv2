import { describe, it, expect } from 'vitest';
import { generate, stream, type GenerateParams } from '@/lib/llm';

// Helper to collect stream into string
async function collectStream(params: GenerateParams): Promise<{ text: string; tokensIn: number | undefined }> {
  let buf = '';
  let tokensIn: number | undefined = undefined;
  for await (const chunk of stream(params)) {
    if (chunk.type === 'start') tokensIn = chunk.tokensIn;
    if (chunk.type === 'delta') buf += chunk.text ?? '';
  }
  return { text: buf, tokensIn };
}

describe('LLM service (DevAdapter)', () => {
  const base: GenerateParams = {
    model: 'gpt-4o-mini',
    prompt: 'Say hello',
    context: 'ctx',
    temperature: 0.1,
  };

  it('generate returns deterministic structure', async () => {
    const res = await generate(base);
    expect(res.model).toBe(base.model);
    expect(typeof res.output).toBe('string');
    expect(typeof res.tokensIn).toBe('number');
    expect(typeof res.tokensOut).toBe('number');
    expect(res.output).toContain('Deterministic response');
    expect(res.tokensIn).toBeGreaterThan(0);
    expect(res.tokensOut).toBeGreaterThan(0);
  });

  it('stream yields start, deltas, done and reconstructs output-like content', async () => {
    const { text, tokensIn } = await collectStream(base);
    expect(tokensIn).toBeGreaterThan(0);
    expect(text).toContain('Streaming response');
    // Streamed text should be non-empty and contain multiple lines
    expect(text.split('\n').length).toBeGreaterThan(2);
  });
});