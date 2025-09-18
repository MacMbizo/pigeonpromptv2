/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from '@/lib/hooks/useAutosave';

// Helper to stub localStorage safely in jsdom
type Store = Record<string, string>;
function createMemoryStorage() {
  let store: Store = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
    dump: () => ({ ...store }),
  } as Storage & { dump: () => Store };
}

const KEY = 'pigeon:test:autosave';

describe('useAutosave behavior', () => {
  const storage = createMemoryStorage();
  let originalLS: Storage;

  beforeEach(() => {
    // Freeze time for determinism
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

    // Override window.localStorage so the hook uses our in-memory store
    originalLS = window.localStorage;
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  });

  afterEach(() => {
    // Restore window.localStorage
    Object.defineProperty(window, 'localStorage', { value: originalLS, configurable: true });
    storage.clear();
    vi.useRealTimers();
  });

  it('debounces writes and transitions saving -> saved when dirty input changes', async () => {
    const { result, rerender } = renderHook(
      ({ draft, isDirty }) => useAutosave({ draft, isDirty, storageKey: KEY, delayMs: 200 }),
      { initialProps: { draft: 'a', isDirty: true } }
    );

    // Immediately after initial render, status should be saving due to isDirty
    expect(result.current.status).toBe('saving');

    // Advance less than debounce; no write yet
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    expect((localStorage as any).dump()[KEY]).toBeUndefined();

    // Change draft again; debounce resets
    rerender({ draft: 'ab', isDirty: true });
    expect(result.current.status).toBe('saving');

    // Advance past debounce; write occurs and status goes saved
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect((localStorage as any).dump()[KEY]).toBeDefined();
    expect(result.current.status).toBe('saved');
  });

  it('manual save shows Saved then clears to idle after 5s window', async () => {
    const { result } = renderHook(() => useAutosave({ draft: 'x', isDirty: true, storageKey: KEY, delayMs: 10 }));

    // Let autosave write once to simulate persisted state
    await act(async () => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.status).toBe('saved');

    // Now emulate successful manual save
    act(() => {
      result.current.onManualSaveSuccess();
    });
    expect(result.current.status).toBe('saved');

    // After 5s window, status should clear to idle
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.status).toBe('idle');
  });

  it('clears storage and moves to idle when becoming clean (unless preserving saved)', async () => {
    const { result, rerender } = renderHook(
      ({ draft, isDirty }) => useAutosave({ draft, isDirty, storageKey: KEY, delayMs: 10 }),
      { initialProps: { draft: 'hello', isDirty: true } }
    );

    await act(async () => {
      vi.advanceTimersByTime(15);
    });
    expect(result.current.status).toBe('saved');

    // Transition to clean; saved state should be preserved per helper
    rerender({ draft: 'hello', isDirty: false });
    expect(result.current.status).toBe('saved');
    // storage should be cleared on clean
    expect((localStorage as any).dump()[KEY]).toBeUndefined();

    // If we clear explicitly, idle unless currently saved
    act(() => {
      result.current.clear();
    });
    // Because previous state was 'saved', clear keeps it saved per implementation
    expect(result.current.status).toBe('saved');
  });
});