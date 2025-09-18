// Token estimation and cost utilities
// Note: heuristic approximation (~4 chars per token)

export function estimateTokens(text: string | null | undefined): number {
  if (!text) return 0;
  const len = text.length;
  // Ensure non-negative; round up to account for partial token
  return Math.max(0, Math.ceil(len / 4));
}

export function estimateCost(tokens: number, pricePerK: number): number | null {
  if (!isFinite(pricePerK) || pricePerK <= 0) return null;
  if (!isFinite(tokens) || tokens <= 0) return 0;
  return (tokens / 1000) * pricePerK;
}