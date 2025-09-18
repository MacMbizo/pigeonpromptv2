"use client";
import React from "react";
import { estimateTokens, estimateCost } from "@/lib/token-estimator";
import { assembleContext, sumIncludedTokens } from "@/lib/context-builder";
import {
  validatePresetName,
  listPresets,
  savePreset,
  loadPresetBySlug,
  deletePresetBySlug,
  buildExportFilename,
  type PresetMeta,
} from "@/lib/presets";
import { formatUsd } from "@/lib/format";

// Local: model price presets used to autofill $/1K tokens in the Cost HUD
const MODEL_PRESETS: Array<{ id: string; label: string; pricePerK: number }> = [
  { id: "gpt-4o-mini", label: "GPT-4o mini", pricePerK: 0.15 },
  { id: "gpt-4o", label: "GPT-4o", pricePerK: 5.0 },
  { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", pricePerK: 3.0 },
  { id: "o3-mini", label: "OpenAI o3-mini", pricePerK: 1.1 },
];

type Item = { id: string; t: "file" | "snippet" | "note"; name: string; content: string; included: boolean; tokens: number };

export default function InventoryPage() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [budget, setBudget] = React.useState<number | "">("");
  const [fmt, setFmt] = React.useState<"text" | "xml">("text");
  const fileRef = React.useRef<HTMLInputElement>(null);
  // Cost HUD state
  const [pricePerK, setPricePerK] = React.useState<string>("");
  
  // New: Preview & highlight controls state
  const [highlight, setHighlight] = React.useState<boolean>(false);
  const [previewMode, setPreviewMode] = React.useState<"full" | "head" | "tail" | "custom">("full");
  const [previewLines, setPreviewLines] = React.useState<number>(10);
  const [previewCustomStart, setPreviewCustomStart] = React.useState<number>(1);
  const [previewCustomEnd, setPreviewCustomEnd] = React.useState<number>(10);

  // Presets state
  const [presetName, setPresetName] = React.useState<string>("");
  const [presetNameError, setPresetNameError] = React.useState<string>("");
  const [presets, setPresets] = React.useState<PresetMeta[]>([]);

  const refreshPresets = React.useCallback(() => {
    try {
      const list = listPresets();
      setPresets(list);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ctx.items");
      const b = localStorage.getItem("ctx.budget");
      if (raw) {
        const parsed = JSON.parse(raw) as Item[];
        setItems(parsed.map((i) => ({ ...i, tokens: estimateTokens(i.content) })));
      }
      if (b) {
        const n = Number(b);
        if (Number.isFinite(n)) setBudget(n);
      }
      // restore price if previously set
      const p = localStorage.getItem("ctx.pricePerK");
      if (p) setPricePerK(p);
    } catch (e) {
      // ignore storage parse errors to keep UX smooth
    }
    refreshPresets();
  }, [refreshPresets]);

  React.useEffect(() => {
    try {
      localStorage.setItem("ctx.items", JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  }, [items]);

  React.useEffect(() => {
    try {
      localStorage.setItem("ctx.budget", String(budget || ""));
    } catch (e) {
      // ignore
    }
  }, [budget]);

  React.useEffect(() => {
    try {
      localStorage.setItem("ctx.pricePerK", pricePerK);
    } catch (e) {
      // ignore
    }
  }, [pricePerK]);

  const total = React.useMemo(() => sumIncludedTokens(items), [items]);

  const estimatedCost = React.useMemo(() => {
    const price = parseFloat(pricePerK);
    return estimateCost(total, price);
  }, [total, pricePerK]);

  // Assembled text for preview, honors current export format
  const assembledText = React.useMemo(() => assembleContext(items, fmt), [items, fmt]);

  // Apply excerpt modes similar to Studio preview
  const previewText = React.useMemo(() => {
    let processedText = assembledText || "";
    if (previewMode !== "full" && processedText) {
      const lines = processedText.split("\n");
      switch (previewMode) {
        case "head": {
          processedText = lines.slice(0, previewLines).join("\n");
          if (lines.length > previewLines) {
            processedText += `\n\n[... ${lines.length - previewLines} more lines]`;
          }
          break;
        }
        case "tail": {
          if (lines.length > previewLines) {
            processedText = `[... ${lines.length - previewLines} lines above]\n\n` + lines.slice(-previewLines).join("\n");
          }
          break;
        }
        case "custom": {
          const start = Math.max(0, previewCustomStart - 1);
          const end = Math.min(lines.length, previewCustomEnd);
          if (start > 0) {
            processedText = `[... ${start} lines above]\n\n`;
          } else {
            processedText = "";
          }
          processedText += lines.slice(start, end).join("\n");
          if (end < lines.length) {
            processedText += `\n\n[... ${lines.length - end} more lines]`;
          }
          break;
        }
      }
    }
    return processedText;
  }, [assembledText, previewMode, previewLines, previewCustomStart, previewCustomEnd]);

  // New: Lightweight XML syntax highlighting (safe – operates on escaped text)
  const highlightedPreviewHtml = React.useMemo(() => {
    if (!highlight || fmt !== "xml") return null;
    const escapeHtml = (s: string) => s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const esc = escapeHtml(previewText);
    // Colorize XML tags and tag names; attributes left as-is for simplicity
    const html = esc.replace(/&lt;(?:\/)?([^&\s>]+)([^>]*)&gt;/g, (match, name: string, rest: string) => {
      const isClosing = match.startsWith("&lt;/");
      const openBracket = `<span style="color:#475569">&lt;${isClosing ? "/" : ""}</span>`; // slate-600
      const tagName = `<span style="color:#1d4ed8">${name}</span>`; // blue-700
      const attrs = `${rest}`; // already escaped
      const closeBracket = `<span style="color:#475569">&gt;</span>`;
      return `<span>${openBracket}${tagName}${attrs}${closeBracket}</span>`;
    });
    return html;
  }, [highlight, fmt, previewText]);

  function add(type: Item["t"]) {
    const id = crypto.randomUUID();
    const base: Item = { id, t: type, name: type === "snippet" ? "Snippet" : "Note", content: "", included: true, tokens: 0 };
    setItems((p) => [...p, base]);
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = e.target.files;
    if (!fs || !fs.length) return;
    const arr = await Promise.all(
      Array.from(fs).map(
        (f) =>
          new Promise<Item>((res) => {
            const r = new FileReader();
            r.onload = () => {
              const txt = String(r.result || "");
              const content = txt.length > 200000 ? txt.slice(0, 200000) : txt;
              res({ id: crypto.randomUUID(), t: "file", name: f.name, content, included: true, tokens: estimateTokens(content) });
            };
            r.readAsText(f);
          })
      )
    );
    setItems((p) => [...p, ...arr]);
    e.target.value = "";
  }

  function upd(id: string, patch: Partial<Item>) {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch, tokens: patch.content !== undefined ? estimateTokens(patch.content) : x.tokens } : x)));
  }
  function del(id: string) {
    setItems((p) => p.filter((x) => x.id !== id));
  }
  function mv(id: string, dir: -1 | 1) {
    setItems((p) => {
      const i = p.findIndex((x) => x.id === id);
      if (i < 0) return p;
      const n = [...p];
      const j = i + dir;
      if (j < 0 || j >= n.length) return p;
      const [it] = n.splice(i, 1);
      n.splice(j, 0, it);
      return n;
    });
  }

  // Presets actions
  function onSavePreset() {
    const name = presetName.trim();
    const v = validatePresetName(name);
    if (!v.ok) {
      setPresetNameError(v.message || "Invalid name");
      return;
    }
    setPresetNameError("");
    const data = {
      items,
      budget,
      fmt,
      pricePerK,
    };
    savePreset(name, data);
    setPresetName("");
    refreshPresets();
    // Optional: toast could be added later
  }

  function onLoadPreset(slug: string) {
    const rec = loadPresetBySlug(slug);
    if (!rec) return;
    const d = rec.data as { items?: Item[]; budget?: number | ""; fmt?: "text" | "xml"; pricePerK?: string };
    if (Array.isArray(d.items)) {
      setItems(d.items.map((i) => ({ ...i, id: i.id || crypto.randomUUID(), tokens: estimateTokens(i.content) })));
    }
    if (d.budget !== undefined) setBudget(d.budget as any);
    if (d.fmt) setFmt(d.fmt);
    if (d.pricePerK !== undefined) setPricePerK(String(d.pricePerK));
  }

  function onDeletePreset(slug: string) {
    deletePresetBySlug(slug);
    refreshPresets();
  }

  function onExportPreset(slug: string) {
    const rec = loadPresetBySlug(slug);
    if (!rec) return;
    const json = JSON.stringify({ meta: rec.meta, data: rec.data }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = buildExportFilename(rec.meta.name);
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const importRef = React.useRef<HTMLInputElement>(null);
  function onImportFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const txt = String(reader.result || "");
        const obj = JSON.parse(txt);
        // Expect { meta?: { name? }, data: { items, budget, fmt, pricePerK } }
        const nameRaw: string = obj?.meta?.name || obj?.name || "Imported preset";
        const data = obj?.data ?? obj;
        savePreset(nameRaw, data);
        refreshPresets();
      } catch (e) {
        // ignore parse errors
      } finally {
        if (importRef.current) importRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  async function copy() {
    const txt = assembleContext(items, fmt);
    try {
      await navigator.clipboard.writeText(txt);
    } catch (e) {
      // ignore
    }
  }
  function download() {
    const txt = assembleContext(items, fmt);
    const blob = new Blob([txt], { type: fmt === "xml" ? "application/xml" : "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fmt === "xml" ? "context.xml" : "context.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold" data-testid="context-builder-title">
        Context Builder
      </h1>
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-1 rounded bg-gray-800 text-white" onClick={() => add("snippet")} data-testid="add-snippet">
          Add Snippet
        </button>
        <button className="px-3 py-1 rounded bg-gray-800 text-white" onClick={() => add("note")} data-testid="add-note">
          Add Note
        </button>
        <button className="px-3 py-1 rounded bg-gray-800 text-white" onClick={() => fileRef.current?.click()} data-testid="import-files">
          Import Files
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={onFiles} />
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm">Budget</label>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value === "" ? "" : Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            inputMode="numeric"
            className="w-24 border rounded px-2 py-1"
            placeholder="tokens"
            data-testid="budget-input"
          />
          <select className="border rounded px-2 py-1" value={fmt} onChange={(e) => setFmt(e.target.value as any)} data-testid="export-format">
            <option value="text">Text</option>
            <option value="xml">XML</option>
          </select>
          {/* New: Syntax highlight toggle (enabled only for XML) */}
          <label className="inline-flex items-center gap-1 text-xs opacity-80" title="Highlight XML tags in Preview">
            <input
              type="checkbox"
              className="accent-blue-500"
              checked={highlight}
              onChange={(e) => setHighlight(e.target.checked)}
              data-testid="preview-highlight-toggle"
            />
            Highlight
          </label>
          <button className="px-3 py-1 rounded-md border border-neutral-300/60 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700/60 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700" onClick={copy} data-testid="copy-btn">
            Copy
          </button>
          <button className="px-3 py-1 rounded-md border border-neutral-300/60 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700/60 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700" onClick={download} data-testid="download-btn">
            Download
          </button>
        </div>
        {/* Cost HUD / Budget gauge */}
        {budget !== "" && budget > 0 && (
          <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden" role="progressbar" aria-label="Token budget usage" aria-valuemin={0} aria-valuemax={Number(budget)} aria-valuenow={Math.min(total, Number(budget))}>
            <div
              className="h-full"
              data-testid="budget-gauge-inner"
              style={{ width: `${Math.min(100, (total / (budget as number)) * 100)}%`, backgroundColor: total > (budget as number) ? "#ef4444" : "#22c55e" }}
            />
          </div>
        )}
      </div>

      {/* Toolbar / Controls above items list */}
      <div className="p-2 flex flex-wrap items-center gap-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
        {/* left-side controls injected above */}
        {/* Cost HUD */}
        <div className="flex flex-wrap items-center gap-3 text-sm" data-testid="cost-hud">
          <label htmlFor="inventory-pricePerK" className="opacity-70">$/1K tokens</label>
          <input
            id="inventory-pricePerK"
            data-testid="inventory-price-input"
            type="number"
            min="0"
            step="0.0001"
            inputMode="decimal"
            value={pricePerK}
            onChange={(e) => setPricePerK(e.target.value)}
            placeholder="e.g. 0.005"
            className="w-28 rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
          />
          <label htmlFor="inventory-modelPresetSelect" className="opacity-70">Model preset</label>
          <select
            id="inventory-modelPresetSelect"
            data-testid="inventory-model-preset"
            className="rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
            defaultValue=""
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              const preset = MODEL_PRESETS.find((p) => p.id === id);
              if (!preset) return;
              setPricePerK(String(preset.pricePerK));
              // reset back to placeholder after applying
              e.currentTarget.value = "";
            }}
            title="Select a preset to autofill price"
          >
            <option value="" disabled>
              Select preset…
            </option>
            {MODEL_PRESETS.map((p) => (
              <option key={p.id} value={p.id} title={`$/${1000} tokens ≈ ${p.pricePerK}`}>
                {p.label ?? p.id}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-70">Total:</span>
            <span data-testid="token-total" className="font-medium" aria-live="polite">
              {total} tokens
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="opacity-70">Est. cost:</span>
            <span data-testid="inventory-estimated-cost" className="font-medium" aria-live="polite">
              {formatUsd(estimatedCost, 4)}
            </span>
          </div>
        </div>
      </div>

      {/* Presets Panel */}
      <section className="rounded-md border border-neutral-200/60 bg-white p-3 shadow-sm dark:border-neutral-800/60 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" aria-labelledby="presets-title">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 id="presets-title" className="text-sm font-medium opacity-80">Presets</h2>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name (e.g., System + 3 Notes)"
            className="min-w-[16rem] flex-1 rounded-md border border-neutral-300/60 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 dark:border-neutral-700/60 dark:bg-neutral-950"
            aria-invalid={presetNameError ? true : undefined}
            aria-describedby={presetNameError ? "preset-name-error" : undefined}
            data-testid="preset-name-input"
          />
          <button
            className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={onSavePreset}
            disabled={!presetName.trim()}
            data-testid="preset-save-btn"
          >
            Save preset
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImportFile(e.target.files)}
            data-testid="preset-import-input"
          />
          <button
            type="button"
            className="rounded-md border border-neutral-300/60 bg-white px-3 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-700/60 dark:bg-neutral-950 dark:hover:bg-neutral-900"
            onClick={() => importRef.current?.click()}
            aria-label="Import preset from JSON"
            data-testid="preset-import-btn"
          >
            Import…
          </button>
          {presetNameError ? (
            <p id="preset-name-error" className="text-xs text-red-600" role="alert">{presetNameError}</p>
          ) : null}
        </div>
        <ul className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60" data-testid="preset-list">
          {presets.length === 0 ? (
            <li className="py-2 text-sm opacity-70">No presets yet. Create one above.</li>
          ) : (
            presets.map((p) => (
              <li key={p.slug} className="flex items-center gap-2 py-2" data-testid={`preset-item-${p.slug}`}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate" title={p.name}>{p.name}</span>
                  <span className="text-xs opacity-60">·</span>
                  <span className="text-xs opacity-60">{new Date(p.updatedAt || p.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md border border-neutral-300/60 bg-white px-2 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700/60 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                    onClick={() => onLoadPreset(p.slug)}
                    aria-label={`Load ${p.name}`}
                    data-testid={`preset-load-${p.slug}`}
                  >
                    Load
                  </button>
                  <button
                    className="rounded-md border border-neutral-300/60 bg-white px-2 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700/60 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                    onClick={() => onExportPreset(p.slug)}
                    aria-label={`Export ${p.name}`}
                    data-testid={`preset-export-${p.slug}`}
                  >
                    Export
                  </button>
                  <button
                    className="rounded-md border border-red-200/60 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
                    onClick={() => onDeletePreset(p.slug)}
                    aria-label={`Delete ${p.name}`}
                    data-testid={`preset-delete-${p.slug}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <ul className="space-y-3" data-testid="items-list">
        {items.map((i, idx) => (
          <li key={i.id} className="border rounded" data-testid="item-row">
            <div className="p-2 flex flex-wrap items-center gap-2 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
              <input type="checkbox" checked={i.included} onChange={(e) => upd(i.id, { included: e.target.checked })} />
              <input className="border border-neutral-300/60 dark:border-neutral-700/60 rounded px-2 py-1 flex-1 min-w-[10rem] bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400" value={i.name} onChange={(e) => upd(i.id, { name: e.target.value })} />
              <span className="text-xs px-2 py-1 rounded bg-gray-100 capitalize">{i.t}</span>
              <span className="text-sm text-gray-600">{i.tokens} tok</span>
              <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => mv(i.id, -1)} aria-label="Move up">
                ↑
              </button>
              <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => mv(i.id, 1)} aria-label="Move down">
                ↓
              </button>
              <button className="px-2 py-1 bg-red-100 text-red-700 rounded" onClick={() => del(i.id)}>
                Remove
              </button>
            </div>
            <div className="p-2 bg-gray-50">
              <textarea
                className="w-full h-32 border border-neutral-300/60 dark:border-neutral-700/60 rounded p-2 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                data-testid={`item-content-${idx}`}
                placeholder={i.t === "file" ? "Imported file content (read-only)" : "Write content..."}
                value={i.content}
                onChange={(e) => upd(i.id, { content: e.target.value })}
                readOnly={i.t === "file"}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* Preview Panel */}
      <section className="rounded-md border border-neutral-200/50 bg-neutral-50 p-3 dark:border-neutral-700/50 dark:bg-neutral-950" data-testid="inventory-preview-panel">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-medium opacity-80">Preview</h2>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <label htmlFor="preview-mode" className="opacity-70">Excerpt</label>
            <select
              id="preview-mode"
              value={previewMode}
              onChange={(e) => setPreviewMode(e.target.value as any)}
              className="rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
              data-testid="preview-mode"
            >
              <option value="full">Full</option>
              <option value="head">Head</option>
              <option value="tail">Tail</option>
              <option value="custom">Custom</option>
            </select>
            {previewMode === "head" || previewMode === "tail" ? (
              <>
                <label htmlFor="preview-lines" className="opacity-70">Lines</label>
                <input
                  id="preview-lines"
                  type="number"
                  min={1}
                  value={previewLines}
                  onChange={(e) => setPreviewLines(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                  data-testid="preview-lines-input"
                />
              </>
            ) : null}
            {previewMode === "custom" ? (
              <>
                <label htmlFor="preview-custom-start" className="opacity-70">Start</label>
                <input
                  id="preview-custom-start"
                  type="number"
                  min={1}
                  value={previewCustomStart}
                  onChange={(e) => setPreviewCustomStart(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                  data-testid="preview-custom-start"
                />
                <label htmlFor="preview-custom-end" className="opacity-70">End</label>
                <input
                  id="preview-custom-end"
                  type="number"
                  min={1}
                  value={previewCustomEnd}
                  onChange={(e) => setPreviewCustomEnd(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                  data-testid="preview-custom-end"
                />
              </>
            ) : null}
          </div>
        </div>
        <div className="rounded-md border border-neutral-200/50 bg-white p-2 dark:border-neutral-700/50 dark:bg-neutral-900">
          {highlight && fmt === "xml" ? (
            <pre data-testid="inventory-preview-output" className="max-h-80 overflow-auto whitespace-pre-wrap font-mono text-sm" dangerouslySetInnerHTML={{ __html: highlightedPreviewHtml || "" }} />
          ) : (
            <pre data-testid="inventory-preview-output" className="max-h-80 overflow-auto whitespace-pre-wrap font-mono text-sm">{previewText}</pre>
          )}
        </div>
      </section>
    </div>
  );
}