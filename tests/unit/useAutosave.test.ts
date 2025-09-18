import { describe, it, expect } from 'vitest';
import { nextStatusOnClean, type AutoSaveStatus } from '@/lib/hooks/useAutosave';

describe('nextStatusOnClean', () => {
  it('keeps current status when dirty', () => {
    const statuses: AutoSaveStatus[] = ['idle', 'saving', 'saved'];
    for (const s of statuses) {
      expect(nextStatusOnClean(true, s)).toBe(s);
    }
  });

  it('returns idle when clean and status is idle', () => {
    expect(nextStatusOnClean(false, 'idle')).toBe('idle');
  });

  it('returns saved when clean and status is saved (preserve recent badge)', () => {
    expect(nextStatusOnClean(false, 'saved')).toBe('saved');
  });

  it('returns idle when clean and status is saving (no draft written)', () => {
    expect(nextStatusOnClean(false, 'saving')).toBe('idle');
  });
});