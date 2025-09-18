"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function CreatePromptButton() {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const descRef = React.useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const onOpen = () => {
    setError(null);
    setOpen(true);
    setTimeout(() => nameRef.current?.focus(), 0);
  };
  const onClose = React.useCallback(() => {
    if (submitting) return;
    setOpen(false);
  }, [submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const name = nameRef.current?.value?.trim() || "";
    const description = descRef.current?.value?.trim() || null;
    if (!name) { setError("Name is required"); return; }
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg = data?.error?.message || `Failed to create prompt (status ${res.status})`;
        throw new Error(msg);
      }
      const id = data?.id;
      if (!id) throw new Error("No prompt id returned");
      setOpen(false);
      router.push(`/studio/${id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create prompt");
    } finally {
      setSubmitting(false);
    }
  }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        New Prompt
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="new-prompt-title" className="relative z-10 w-full max-w-md rounded-lg border border-neutral-300/60 bg-white p-4 shadow-xl dark:border-neutral-700/60 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="new-prompt-title" className="text-lg font-semibold">Create New Prompt</h2>
              <button type="button" onClick={onClose} className="rounded p-1 text-neutral-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" disabled={submitting} aria-label="Close">
                ✕
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label htmlFor="prompt-name" className="mb-1 block text-sm font-medium opacity-80">Name</label>
                <input id="prompt-name" ref={nameRef} placeholder="e.g., Customer Support Draft" className="w-full rounded-md border border-neutral-300/60 bg-white px-3 py-2 text-sm outline-none ring-blue-500/0 focus:border-blue-500 focus:ring-1 dark:border-neutral-700/60 dark:bg-neutral-900" />
              </div>
              <div>
                <label htmlFor="prompt-desc" className="mb-1 block text-sm font-medium opacity-80">Description (optional)</label>
                <textarea id="prompt-desc" ref={descRef} rows={3} placeholder="Short description to help you and teammates find it later" className="w-full rounded-md border border-neutral-300/60 bg-white px-3 py-2 text-sm outline-none ring-blue-500/0 focus:border-blue-500 focus:ring-1 dark:border-neutral-700/60 dark:bg-neutral-900" />
              </div>
              {error && <div className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-100">{error}</div>}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={onClose} disabled={submitting} className="rounded-md border border-neutral-300/60 px-3 py-2 text-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 dark:border-neutral-700/60 dark:hover:bg-neutral-800">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}