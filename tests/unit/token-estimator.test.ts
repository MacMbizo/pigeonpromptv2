import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateCost } from '@/lib/token-estimator';

describe('token-estimator', () => {
  it('estimateTokens returns 0 for empty/null/undefined', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens(null as any)).toBe(0);
    expect(estimateTokens(undefined as any)).toBe(0);
  });

  it('estimateTokens uses ceil(len/4) heuristic and non-negative', () => {
    expect(estimateTokens('a')).toBe(1);
    expect(estimateTokens('ab')).toBe(1);
    expect(estimateTokens('abc')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
    expect(estimateTokens('a'.repeat(8))).toBe(2);
    expect(estimateTokens('a'.repeat(9))).toBe(3);
  });

  it('estimateTokens handles longer strings ceil(len/4)', () => {
    expect(estimateTokens('a'.repeat(100))).toBe(25);
  });

  it('estimateCost returns null when pricePerK is invalid or <= 0', () => {
    expect(estimateCost(1000, NaN as any)).toBeNull();
    expect(estimateCost(1000, -1)).toBeNull();
    expect(estimateCost(1000, 0)).toBeNull();
  });

  it('estimateCost returns null for Infinity price values', () => {
    expect(estimateCost(1000, Number.POSITIVE_INFINITY as any)).toBeNull();
    expect(estimateCost(1000, Number.NEGATIVE_INFINITY as any)).toBeNull();
  });

  it('estimateCost returns 0 when tokens invalid or <= 0 even with valid price', () => {
    expect(estimateCost(NaN as any, 1)).toBe(0);
    expect(estimateCost(-5, 1)).toBe(0);
    expect(estimateCost(0, 1)).toBe(0);
  });

  it('estimateCost treats non-finite tokens as zero cost (with valid price)', () => {
    expect(estimateCost(Number.POSITIVE_INFINITY as any, 5)).toBe(0);
    expect(estimateCost(Number.NEGATIVE_INFINITY as any, 5)).toBe(0);
  });

  it('estimateCost computes (tokens/1000) * pricePerK', () => {
    expect(estimateCost(1000, 2)).toBeCloseTo(2);
    expect(estimateCost(1500, 1.5)).toBeCloseTo(2.25);
  });

  it('estimateCost handles very large token counts without precision blowup', () => {
    const largeTokens = 2_147_483_647; // ~2.1B
    const pricePerK = 0.5;
    const expected = (largeTokens / 1000) * pricePerK; // ~1,073,741.8235
    expect(estimateCost(largeTokens, pricePerK)).toBeCloseTo(expected, 6);
  });
});