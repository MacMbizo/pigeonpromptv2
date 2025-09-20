import { useEffect, useRef, useState } from 'react';

// Optional debug flag (client-safe): enable with NEXT_PUBLIC_DEBUG_AUTOSAVE=1
const DEBUG_AUTOSAVE = process.env.NEXT_PUBLIC_DEBUG_AUTOSAVE === '1' || process.env.NEXT_PUBLIC_DEBUG_AUTOSAVE === 'true';
const dlog = (...args: any[]) => {
  if (DEBUG_AUTOSAVE && typeof window !== 'undefined') {
    // Avoid logging full draft content
    // eslint-disable-next-line no-console
    console.debug('[autosave]', ...args);
  }
};

export type AutoSaveStatus = 'idle' | 'saving' | 'saved';

// Pure decision helper: when returning to a clean state, should we clear the badge or preserve a recent Saved state?
export function nextStatusOnClean(isDirty: boolean, current: AutoSaveStatus): AutoSaveStatus {
  if (isDirty) return current;
  // Do not override a recent Saved state; let the transient badge live briefly
  return current === 'saved' ? 'saved' : 'idle';
}

export interface UseAutosaveOptions {
  draft: string;
  isDirty: boolean;
  storageKey: string;
  delayMs?: number; // debounce delay for localStorage writes
}

export interface UseAutosaveApi {
  status: AutoSaveStatus;
  ts: number | null;
  // Call when a full save to backend succeeds to optimistically show Saved and clear storage
  onManualSaveSuccess: () => void;
  // Explicitly clear any autosaved draft and reset status to idle (unless recently saved)
  clear: () => void;
}

export function useAutosave({ draft, isDirty, storageKey, delayMs = 800 }: UseAutosaveOptions): UseAutosaveApi {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [ts, setTs] = useState<number | null>(null);
  const clearTimeoutRef = useRef<number | null>(null);
  const writeTimeoutRef = useRef<number | null>(null);

  // Debounced write to localStorage when draft changes and page is dirty
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isDirty) return;
    setStatus((prev) => {
      if (prev !== 'saving') dlog('status -> saving');
      return 'saving';
    });
    if (writeTimeoutRef.current) window.clearTimeout(writeTimeoutRef.current);
    writeTimeoutRef.current = window.setTimeout(() => {
      try {
        const now = Date.now();
        window.localStorage.setItem(storageKey, JSON.stringify({ ts: now, content: draft, draft }));
        setTs(now);
        dlog('draft persisted', { key: storageKey, ts: now });
        setStatus((prev) => {
          if (prev !== 'saved') dlog('status -> saved');
          return 'saved';
        });
      } catch (e) {
        dlog('persist error (ignored)');
        /* no-op */
      }
    }, delayMs);
    return () => {
      if (writeTimeoutRef.current) window.clearTimeout(writeTimeoutRef.current);
    };
  }, [draft, isDirty, storageKey, delayMs]);

  // Clear autosave when returning to clean state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isDirty) {
      try {
        window.localStorage.removeItem(storageKey);
        dlog('storage cleared on clean state', { key: storageKey });
      } catch (e) {
        /* no-op */
      }
      const next = nextStatusOnClean(isDirty, status);
      if (next !== status) {
        dlog(`status -> ${next}`);
        setStatus(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, storageKey]);

  // Provide imperative API for when a manual save succeeds
  const onManualSaveSuccess = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey);
        dlog('storage cleared on manual save', { key: storageKey });
      } catch (e) {
        /* no-op */
      }
    }
    const now = Date.now();
    setTs(now);
    setStatus((prev) => {
      if (prev !== 'saved') dlog('status -> saved (manual)');
      return 'saved';
    });
    if (clearTimeoutRef.current) window.clearTimeout(clearTimeoutRef.current);
    clearTimeoutRef.current = window.setTimeout(() => {
      dlog('status -> idle (manual window elapsed)');
      setStatus('idle');
    }, 5000);
  };

  // Explicit clear helper
  const clear = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey);
        dlog('storage cleared via clear()', { key: storageKey });
      } catch (e) {
        /* no-op */
      }
      // Cancel any pending debounced write to avoid re-persisting a stale draft after clear()
      if (writeTimeoutRef.current) {
        window.clearTimeout(writeTimeoutRef.current);
        writeTimeoutRef.current = null;
      }
      // Also clear any pending status reset timer to avoid unexpected transitions
      if (clearTimeoutRef.current) {
        window.clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }
    }
    setStatus((prev) => {
      if (prev !== 'saved') {
        dlog('status -> idle (explicit clear)');
        return 'idle';
      }
      return prev;
    });
  };

  // Cleanup any timers on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) window.clearTimeout(clearTimeoutRef.current);
      if (writeTimeoutRef.current) window.clearTimeout(writeTimeoutRef.current);
    };
  }, []);

  return { status, ts, onManualSaveSuccess, clear };
}