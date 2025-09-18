import { describe, it, expect } from 'vitest';
import { validatePresetName, slugifyName, buildExportFilename } from '@/lib/presets';

describe('presets utils', () => {
  it('validates preset names', () => {
    expect(validatePresetName('')).toEqual({ ok: false, message: 'Name is required' });
    expect(validatePresetName('   ')).toEqual({ ok: false, message: 'Name is required' });
    expect(validatePresetName('A')).toEqual({ ok: true });
    const long = 'x'.repeat(81);
    expect(validatePresetName(long).ok).toBe(false);
    expect(validatePresetName('valid name ✅').ok).toBe(true);
  });

  it('slugifies names', () => {
    expect(slugifyName('Hello World')).toBe('hello-world');
    expect(slugifyName('  Multiple   spaces ')).toBe('multiple-spaces');
    expect(slugifyName('ÄÖÜ äöü ß')).toBe('aou-aou-ss');
    expect(slugifyName('Symbols!@#$%^&*()=+[]{};:\'",.<>?/|`~')).toBe('symbols');
    expect(slugifyName('camelCase_and-KEBAP')).toBe('camelcase-and-kebap');
  });

  it('builds export filename with timestamp and slug', () => {
    const fn = buildExportFilename('My Preset Name');
    expect(fn).toMatch(/^pigeon-context-my-preset-name-\d{8}-\d{6}\.json$/);
  });
});
