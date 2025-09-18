import React from 'react';
import type { AutoSaveStatus } from '@/lib/hooks/useAutosave';

export interface AutosaveBadgeProps {
  status: AutoSaveStatus;
  ts?: number | null;
}

/**
 * Presentational autosave status with a screen-reader live region.
 * Renders nothing when status is 'idle'.
 */
export function AutosaveBadge({ status, ts }: AutosaveBadgeProps) {
  const title = ts ? new Date(ts).toLocaleString() : undefined;
  const srText = status === 'saving' ? 'Autosaving' : status === 'saved' ? (ts ? `Saved at ${new Date(ts).toLocaleString()}` : 'Saved') : '';

  if (status === 'idle') {
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