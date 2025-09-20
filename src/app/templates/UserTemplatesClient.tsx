"use client";

import React, { useEffect, useMemo, useState } from "react";
import { extractVariables } from "@/lib/templates/interpolate";

// Align with dev store / DB fields
interface Template {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  user_prompt_template: string;
  variables: string[];
  tags: string[];
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

function classNames(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(" ");
}

export default function UserTemplatesClient() {
  const [userId, setUserId] = useState<string>("demo");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [listEtag, setListEtag] = useState<string | null>(null);

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<Template | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPromptTemplate, setUserPromptTemplate] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const detectedVars = useMemo(() => {
    try {
      return Array.from(extractVariables(userPromptTemplate));
    } catch (_e) {
      return [] as string[];
    }
  }, [userPromptTemplate]);

  async function fetchTemplates(currentUserId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/templates/user?userId=${encodeURIComponent(currentUserId)}`, {
        headers: {
          "x-user-id": currentUserId,
          ...(listEtag ? { "If-None-Match": listEtag } : {}),
        },
        cache: "no-store",
      });
      if (res.status === 304) {
        // Not modified; keep current list and etag
        return;
      }
      if (!res.ok) throw new Error(`Failed to load templates (${res.status})`);
      const data = (await res.json()) as { items: Template[]; total: number } | Template[];
      const items = Array.isArray(data) ? data : data.items;
      setTemplates(items);
      const nextTag = res.headers.get("etag");
      if (nextTag) setListEtag(nextTag);
    } catch (e: any) {
      setError(e?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Reset list etag when switching users
    setListEtag(null);
    fetchTemplates(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function resetForm(t?: Partial<Template>) {
    setName(t?.name ?? "");
    setDescription((t?.description as string) ?? "");
    setSystemPrompt(t?.system_prompt ?? "");
    setUserPromptTemplate(t?.user_prompt_template ?? "");
    setTagsInput((t?.tags ?? []).join(", "));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        system_prompt: systemPrompt,
        user_prompt_template: userPromptTemplate,
        variables: detectedVars,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const res = await fetch(`/api/templates/user?userId=${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to create (${res.status})`);
      await fetchTemplates(userId);
      setMode("list");
      resetForm();
    } catch (e: any) {
      setError(e?.message || "Failed to create template");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setError(null);
    try {
      const payload: Partial<Template> = {
        name: name.trim() || undefined,
        description: description.trim(),
        system_prompt: systemPrompt,
        user_prompt_template: userPromptTemplate,
        variables: detectedVars,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      } as any;

      const res = await fetch(`/api/templates/user/${encodeURIComponent(editing.id)}?userId=${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          // Route expects If-Match containing updated_at (quotes acceptable)
          "If-Match": JSON.stringify(editing.updated_at),
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 412) {
        throw new Error("Template was modified by another process. Please refresh and try again.");
      }
      if (!res.ok) throw new Error(`Failed to update (${res.status})`);
      await fetchTemplates(userId);
      setMode("list");
      setEditing(null);
      resetForm();
    } catch (e: any) {
      setError(e?.message || "Failed to update template");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(t: Template) {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/templates/user/${encodeURIComponent(t.id)}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
          // Optionally send If-Match to guard against concurrent delete-after-update
          "If-Match": JSON.stringify(t.updated_at),
        },
      });
      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
      await fetchTemplates(userId);
    } catch (e: any) {
      setError(e?.message || "Failed to delete template");
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setMode("create");
    setEditing(null);
    resetForm();
  }

  function startEdit(t: Template) {
    setMode("edit");
    setEditing(t);
    resetForm(t);
  }

  return (
    <section className="mt-10" data-testid="user-templates-section">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">My Templates</h2>
          <p className="text-sm text-gray-500">Create, edit, and manage your personal templates. Variables are auto-detected from the user prompt.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600" htmlFor="userId">User</label>
          <input
            id="userId"
            data-testid="user-id-input"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="user id (dev: any string)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <button
            type="button"
            data-testid="refresh-btn"
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            onClick={() => fetchTemplates(userId)}
          >
            Refresh
          </button>
          <button
            type="button"
            data-testid="new-template-btn"
            className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            onClick={startCreate}
          >
            New Template
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" data-testid="error-banner">
          {error}
        </div>
      )}

      {/* List */}
      {mode === "list" && (
        <div className="mt-4 overflow-hidden rounded border border-gray-200" data-testid="templates-list">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Tags</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Updated</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading && templates.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-500" colSpan={4}>Loading…</td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600" colSpan={4} data-testid="empty-state">
                    No templates yet.{' '}
                    <button
                      type="button"
                      className="text-indigo-600 hover:underline"
                      onClick={startCreate}
                      data-testid="empty-cta"
                    >
                      Create your first template
                    </button>
                    .
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} data-testid="template-row">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{t.name}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {t.tags?.map((tag) => (
                          <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">{new Date(t.updated_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className="mr-2 rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        data-testid="edit-btn"
                        onClick={() => startEdit(t)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                        data-testid="delete-btn"
                        onClick={() => handleDelete(t)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Form */}
      {(mode === "create" || mode === "edit") && (
        <form onSubmit={mode === "create" ? handleCreate : handleUpdate} className="mt-5 rounded border border-gray-200 bg-white p-4" data-testid="template-form">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{mode === "create" ? "Create Template" : `Edit: ${editing?.name}`}</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="cancel-btn"
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setMode("list");
                  setEditing(null);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="submit-btn"
                className={classNames(
                  "rounded px-3 py-1.5 text-sm font-medium text-white",
                  loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                )}
                disabled={loading}
              >
                {mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="tpl-name">Name</label>
              <input
                id="tpl-name"
                data-testid="name-input"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="tpl-tags">Tags (comma-separated)</label>
              <input
                id="tpl-tags"
                data-testid="tags-input"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. sales, onboarding"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="tpl-desc">Description</label>
              <textarea
                id="tpl-desc"
                data-testid="description-input"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="tpl-system">System Prompt (optional)</label>
              <textarea
                id="tpl-system"
                data-testid="system-prompt-input"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                rows={6}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="tpl-user">User Prompt Template</label>
              <textarea
                id="tpl-user"
                data-testid="user-prompt-template-input"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
                rows={6}
                value={userPromptTemplate}
                onChange={(e) => setUserPromptTemplate(e.target.value)}
                placeholder="Hi {{name}}, welcome to {{company}}!"
              />
              {detectedVars.length > 0 && (
                <p className="mt-1 text-xs text-gray-500" data-testid="detected-vars">Detected variables: {detectedVars.map((v) => <code key={v} className="mr-1 rounded bg-gray-100 px-1">{v}</code>)}</p>
              )}
            </div>
          </div>
        </form>
      )}
    </section>
  );
}