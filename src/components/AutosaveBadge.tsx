import React, { useEffect, useState } from 'react';
import type { AutoSaveStatus } from '@/lib/hooks/useAutosave';

export interface AutosaveBadgeProps {
  status: AutoSaveStatus;
  ts?: number | null;
}

/**
 * Presentational autosave status with a screen-reader live region.
 * Renders nothing when status is 'idle' or when a 'saved' badge has expired.
 */
export function AutosaveBadge({ status, ts }: AutosaveBadgeProps) {
  const [savedVisible, setSavedVisible] = useState(false);

  // Manage a local 5s visibility window for the 'Saved' badge, based on timestamp.
  useEffect(() => {
    if (status !== 'saved') {
      setSavedVisible(false);
      return;
    }
    setSavedVisible(true);
    const now = Date.now();
    const startTs = typeof ts === 'number' ? ts : now;
    const remaining = Math.max(0, 5000 - (now - startTs));
    const timer = window.setTimeout(() => setSavedVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, [status, ts]);

  const title = ts ? new Date(ts).toLocaleString() : undefined;
  const srText = status === 'saving' ? 'Autosaving' : status === 'saved' ? (ts ? `Saved at ${new Date(ts).toLocaleString()}` : 'Saved') : '';

  const showBadge = status === 'saving' || (status === 'saved' && savedVisible);

  if (!showBadge) {
    return (
      <span aria-live="polite" className="sr-only" data-testid="autosave-live-region">{srText}</span>
    );
  }

  return (
    <>
      <span aria-live="polite" className="sr-only" data-testid="autosave-live-region">{srText}</span>
      {status === 'saving' ? (
        <span
          className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          data-testid="autosave-badge"
        >
          Autosaving…
        </span>
      ) : (
        <span
          className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          title={title}
          data-testid="autosave-badge"
        >
          Saved
        </span>
      )}
    </>
  );
}

export default AutosaveBadge;