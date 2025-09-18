import { describe, it, expect } from 'vitest';
import { formatUsd } from '@/lib/format';

describe('formatUsd', () => {
  it('returns em dash for null/undefined/NaN', () => {
    expect(formatUsd(null)).toBe('—');
    expect(formatUsd(undefined)).toBe('—');
    expect(formatUsd(NaN)).toBe('—');
  });

  it('formats with 4 decimals by default', () => {
    expect(formatUsd(0)).toBe('$0.0000');
    expect(formatUsd(0.03)).toBe('$0.0300');
  });

  it('respects custom digits and thousands separators', () => {
    expect(formatUsd(1234.5, 2)).toBe('$1,234.50');
    expect(formatUsd(1234.5, 4)).toBe('$1,234.5000');
  });

  it('handles negative numbers', () => {
    expect(formatUsd(-1, 2)).toBe('-$1.00');
  });
});