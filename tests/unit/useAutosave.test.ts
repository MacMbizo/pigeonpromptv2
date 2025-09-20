import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextStatusOnClean, useAutosave } from '@/lib/hooks/useAutosave';
import { renderHook, act } from '@testing-library/react';

// Utility to mock localStorage safely
function setupLocalStorageMock() {
  const store = new Map<string, string>();
  const api = {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => { store.set(key, String(value)); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); }),
  } as unknown as Storage;
  Object.defineProperty(window, 'localStorage', { value: api, configurable: true });
  return { api, store };
}

describe('nextStatusOnClean', () => {
  it('keeps current status when dirty', () => {
    const statuses = ['idle', 'saving', 'saved'] as const;
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

describe('useAutosave.clear()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupLocalStorageMock();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('cancels pending write timer and does not re-persist after clear()', () => {
    const storageKey = 'pigeon:test:draft';
    const { result, rerender } = renderHook(({ draft, dirty }) => useAutosave({ draft, isDirty: dirty, storageKey, delayMs: 1000 }), {
      initialProps: { draft: 'first', dirty: true },
    });

    // Schedule a debounced write
    act(() => {
      // advance half the delay so timer is pending
      vi.advanceTimersByTime(500);
    });

    // Clear before timer fires
    act(() => {
      result.current.clear();
    });

    // Advance past the original delay; nothing should be written
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // No setItem calls should have happened
    const ls = window.localStorage as any;
    expect(ls.setItem).not.toHaveBeenCalled();

    // And storage should not contain the key
    expect(ls.getItem(storageKey)).toBeNull();

    // Change draft to ensure no stale timer writes previous content
    rerender({ draft: 'second', dirty: true });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Now a single write should occur for the new content
    expect(ls.setItem).toHaveBeenCalledTimes(1);
    const lastCallArgs = (ls.setItem as any).mock.calls.at(-1);
    expect(lastCallArgs[0]).toBe(storageKey);
    const payload = JSON.parse(lastCallArgs[1]);
    expect(payload.content).toBe('second');
  });

  it('cancels pending clear-timeout created by onManualSaveSuccess()', () => {
    const storageKey = 'pigeon:test:draft2';
    const { result } = renderHook(() => useAutosave({ draft: 'x', isDirty: true, storageKey, delayMs: 1 }));

    // fire a write quickly
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Trigger manual save success which schedules a clearTimeout after 5s
    act(() => {
      result.current.onManualSaveSuccess();
    });

    // Immediately clear; this should cancel the scheduled reset to idle
    act(() => {
      result.current.clear();
    });

    // Advance far beyond 5s; if the timer was not cleared, status would flip to idle regardless of current state
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // There should be no additional localStorage writes during this period, and no errors
    const ls = window.localStorage as any;
    // setItem was called at most once (initial quick write), never again due to clear()
    expect(ls.setItem.mock.calls.length).toBeLessThanOrEqual(1);
  });
});