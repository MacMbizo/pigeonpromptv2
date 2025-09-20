'use client'
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { estimateCost, estimateTokens } from "@/lib/token-estimator";
import { renderTemplate } from "@/lib/templates/interpolate";
import { formatUsd } from "@/lib/format";
import { useAutosave } from "@/lib/hooks/useAutosave";
import AutosaveBadge from "@/components/AutosaveBadge";

type PromptDetail = {
  id: string;
  author_id: string;
  name: string;
  description: string | null;
  variables: any[];
  status: "draft" | "public" | "flagged" | "removed";
  score: number;
  created_at: string;
  updated_at: string;
};

type PromptVersion = {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  model_targets: string[];
  changelog: string | null;
  created_at: string;
};

// Move DiffLine type alias to top-level to avoid TSX parsing ambiguities inside function scope
export type DiffLine = { type: "added" | "removed" | "unchanged"; text: string } | { type: "replace"; oldText: string; newText: string };

// PP-001: Context Preview module types and defaults
// Simple mock files so the UI shell and E2E can operate before backend wiring
type ContextFile = { id: string; name: string; content: string };
const DEFAULT_CONTEXT_FILES: ContextFile[] = [
  { id: "f1", name: "README.md", content: Array.from({ length: 50 }, (_, i) => `README line ${i + 1}`).join("\n") },
  { id: "f2", name: "src/index.ts", content: Array.from({ length: 30 }, (_, i) => `index.ts line ${i + 1}`).join("\n") },
  { id: "f3", name: "docs/usage.md", content: Array.from({ length: 20 }, (_, i) => `usage line ${i + 1}`).join("\n") },
];

// Diff utilities at module scope for stable identity
function charLCS(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[] = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    let prev = 0;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      if (a[i - 1] === b[j - 1]) dp[j] = prev + 1;
      else dp[j] = Math.max(dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  const lcs = charLCS(a, b);
  return lcs / Math.max(1, Math.max(a.length, b.length));
}

function tokenizeWords(s: string): string[] {
  return s.split(/(\s+)/); // keep whitespace tokens
}

function diffWords(oldLine: string, newLine: string): Array<{ t: "=" | "+" | "-"; text: string }> {
  const a = tokenizeWords(oldLine);
  const b = tokenizeWords(newLine);
  const m = a.length, n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const segs: Array<{ t: "=" | "+" | "-"; text: string }> = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      segs.push({ t: "=", text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      segs.push({ t: "-", text: a[i++] });
    } else {
      segs.push({ t: "+", text: b[j++] });
    }
  }
  while (i < m) segs.push({ t: "-", text: a[i++] });
  while (j < n) segs.push({ t: "+", text: b[j++] });
  return segs;
}

function computeDiff(a: string, b: string): DiffLine[] {
  // Line-by-line LCS, then fold adjacent remove+add into replace when similar
  const aLines = a.split(/\r?\n/);
  const bLines = b.split(/\r?\n/);
  const dp: number[][] = Array(aLines.length + 1)
    .fill(0)
    .map(() => Array(bLines.length + 1).fill(0));
  for (let i = aLines.length - 1; i >= 0; i--) {
    for (let j = bLines.length - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const raw: Array<{ kind: "added" | "removed" | "unchanged"; text: string }> = [];
  let i = 0, j = 0;
  while (i < aLines.length && j < bLines.length) {
    if (aLines[i] === bLines[j]) {
      raw.push({ kind: "unchanged", text: aLines[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ kind: "removed", text: aLines[i++] });
    } else {
      raw.push({ kind: "added", text: bLines[j++] });
    }
  }
  while (i < aLines.length) raw.push({ kind: "removed", text: aLines[i++] });
  while (j < bLines.length) raw.push({ kind: "added", text: bLines[j++] });

  // Fold into replace ops when similar
  const out: DiffLine[] = [];
  for (let k = 0; k < raw.length; k++) {
    const cur = raw[k];
    const nxt = raw[k + 1];
    if (cur && nxt && cur.kind === "removed" && nxt.kind === "added") {
      const sim = similarity(cur.text, nxt.text);
      if (sim >= 0.4) {
        out.push({ type: "replace", oldText: cur.text, newText: nxt.text });
        k++; // skip next
        continue;
      }
    }
    if (cur.kind === "unchanged") out.push({ type: "unchanged", text: cur.text });
    if (cur.kind === "removed") out.push({ type: "removed", text: cur.text });
    if (cur.kind === "added") out.push({ type: "added", text: cur.text });
  }
  return out;
}

export default function PromptStudioPage({ params }: { params: { id: string } }) {
  const promptId = params.id;
  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [changelog, setChangelog] = useState<string>("");
  const [pricePerK, setPricePerK] = useState<string>("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // New: Diff display controls
  const [hideUnchanged, setHideUnchanged] = useState(false);
  const [wordLevel, setWordLevel] = useState(true);
  // New: model targets input state
  const [modelTargetsInput, setModelTargetsInput] = useState("");
  // New: autosave and recovery
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [recoverInfo, setRecoverInfo] = useState<{ ts: number; draft: string } | null>(null);
  // New: side-by-side diff and context expansion
  const [sideBySide, setSideBySide] = useState(false);
  const [contextRadius, setContextRadius] = useState(0);
  // New: Preview state
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [missingPolicy, setMissingPolicy] = useState<"leave" | "empty" | "error" | "annotate">("annotate");
  const [previewMode, setPreviewMode] = useState<"full" | "head" | "tail" | "custom">("full");
  const [previewLines, setPreviewLines] = useState<number>(10);
  const [previewCustomStart, setPreviewCustomStart] = useState<number>(1);
  const [previewCustomEnd, setPreviewCustomEnd] = useState<number>(10);
  const [includeVariables, setIncludeVariables] = useState<boolean>(true);
  const [includeTokenCount, setIncludeTokenCount] = useState<boolean>(true);
  const [includeModelTargets, setIncludeModelTargets] = useState<boolean>(false);
  const ENABLE_CONTEXT_PREVIEW = process.env.NEXT_PUBLIC_E2E_ENABLE_CONTEXT_PREVIEW === '1';

  // PP-001: Context Preview state and persistence
  type ExcerptMode = "head" | "tail" | "custom";
  type FilePref = { include: boolean; mode: ExcerptMode; start: number; end: number };
  const [contextFiles] = useState<ContextFile[]>(DEFAULT_CONTEXT_FILES);
  const [filePrefs, setFilePrefs] = useState<Record<string, FilePref>>({});

  // Load persisted prefs per promptId
  useEffect(() => {
    try {
      const key = `pigeon:studio:${promptId}:context-preview`;
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      const parsed = raw ? (JSON.parse(raw) as Record<string, FilePref>) : null;
      if (parsed && typeof parsed === "object") {
        setFilePrefs(parsed);
      } else {
        const init: Record<string, FilePref> = {};
        for (const f of contextFiles) init[f.id] = { include: true, mode: "head", start: 1, end: 10 };
        setFilePrefs(init);
      }
    } catch {
      const init: Record<string, FilePref> = {};
      for (const f of contextFiles) init[f.id] = { include: true, mode: "head", start: 1, end: 10 };
      setFilePrefs(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId]);

  // Persist on change
  useEffect(() => {
    try {
      const key = `pigeon:studio:${promptId}:context-preview`;
      if (typeof window !== "undefined" && Object.keys(filePrefs).length) {
        localStorage.setItem(key, JSON.stringify(filePrefs));
      }
    } catch {
      // no-op
    }
  }, [filePrefs, promptId]);

  // Helper: slice content by pref
  const materializedContent = useMemo(() => {
    const out: Record<string, string> = {};
    for (const f of contextFiles) {
      const pref = filePrefs[f.id];
      if (!pref?.include) continue;
      const lines = f.content.split(/\n/);
      let segment = "";
      if (pref.mode === "head") {
        const n = Math.max(1, pref.end || 10);
        segment = lines.slice(0, n).join("\n");
      } else if (pref.mode === "tail") {
        const n = Math.max(1, pref.end || 10);
        segment = lines.slice(-n).join("\n");
      } else {
        const start = Math.max(0, (pref.start || 1) - 1);
        const end = Math.max(start + 1, Math.min(lines.length, pref.end || 10));
        segment = lines.slice(start, end).join("\n");
      }
      out[f.id] = segment;
    }
    return out;
  }, [contextFiles, filePrefs]);

  const hudTokenCount = useMemo(() => {
    const joined = Object.values(materializedContent).join("\n\n");
    return joined ? estimateTokens(joined) : 0;
  }, [materializedContent]);

  function updatePref(id: string, patch: Partial<FilePref>) {
    setFilePrefs((prev) => ({
      ...prev,
      [id]: {
        include: prev[id]?.include ?? true,
        mode: (prev[id]?.mode ?? "head") as ExcerptMode,
        start: prev[id]?.start ?? 1,
        end: prev[id]?.end ?? 10,
        ...patch,
      },
    }));
  }

  const loadData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, vRes] = await Promise.all([
        fetch(`/api/prompts/${id}`, { headers: { accept: "application/json" } }),
        fetch(`/api/prompts/${id}/versions`, { headers: { accept: "application/json" } }),
      ]);
      if (!pRes.ok) throw new Error(`Failed to load prompt (${pRes.status})`);
      if (!vRes.ok) throw new Error(`Failed to load versions (${vRes.status})`);
      const pJson = (await pRes.json()) as PromptDetail;
      const vJson = (await vRes.json()) as { items: PromptVersion[] };
      setPrompt(pJson);
      setVersions(vJson.items || []);
      const latest = vJson.items?.[0] || null;
      setSelectedVersion(latest ? latest.version : null);
      setDraft(latest ? latest.content : "");
      // Initialize model targets input from latest version
      setModelTargetsInput(latest?.model_targets?.length ? latest.model_targets.join(", ") : "");
      // Check for autosaved draft to recover
      try {
        const key = `pigeon:studio:${id}:draft`;
        const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          const candidate = typeof parsed?.draft === "string" ? parsed.draft : (typeof parsed?.content === "string" ? parsed.content : null);
          if (candidate !== null && candidate !== (latest ? latest.content : "")) {
            setRecoverInfo({ ts: parsed.ts || Date.now(), draft: candidate });
          }
        }
      } catch (e) {
        // no-op: localStorage or JSON parse may fail
      }
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(promptId);
  }, [promptId, loadData]);

  const baseContent = useMemo(() => {
    const v = versions.find((x) => x.version === selectedVersion);
    return v?.content ?? "";
  }, [versions, selectedVersion]);

  const isDirty = useMemo(() => draft !== baseContent, [draft, baseContent]);

  // Autosave controller
  const autosave = useAutosave({ draft, isDirty, storageKey: `pigeon:studio:${promptId}:draft` });

  // Warn before closing tab or refreshing if there are unsaved changes
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  const diff = useMemo(() => computeDiff(baseContent, draft), [baseContent, draft]);

  // New: filtered indices based on hideUnchanged + contextRadius
  const filteredDiffIndices = useMemo(() => {
    if (!hideUnchanged && contextRadius === 0) return diff.map((_, i) => i);
    const changed = new Set<number>();
    diff.forEach((d, i) => {
      if (d.type !== "unchanged") changed.add(i);
    });
    if (!hideUnchanged) return diff.map((_, i) => i);
    const include = new Set<number>();
    diff.forEach((d, i) => {
      if (changed.has(i)) {
        for (let k = Math.max(0, i - contextRadius); k <= Math.min(diff.length - 1, i + contextRadius); k++) {
          include.add(k);
        }
      }
    });
    return Array.from(include).sort((a, b) => a - b);
  }, [diff, hideUnchanged, contextRadius]);

  // Approximate token estimator (replace with real tokenizer in later step)
  const tokenCount = useMemo(() => (draft ? estimateTokens(draft) : 0), [draft]);

  // Inline variable validation: extract variable placeholders
  function extractVariables(s: string): string[] {
    const names = new Set<string>();
    const patterns = [
      /\{\{\s*([a-zA-Z0-9_.:-]+)\s*\}\}/g,
      /\$\{\s*([a-zA-Z0-9_.:-]+)\s*\}/g,
      /<<\s*([a-zA-Z0-9_.:-]+)\s*>>/g,
      /<%\s*([a-zA-Z0-9_.:-]+)\s*%>/g,
    ];
    for (const re of patterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(s))) {
        if (m[1]) names.add(m[1]);
      }
    }
    return Array.from(names);
  }

  const usedVars = useMemo(() => extractVariables(draft), [draft]);
  const expectedVars = useMemo(() => (Array.isArray(prompt?.variables) ? (prompt!.variables as any[]).map((v) => String((v as any)?.name ?? v)) : []), [prompt]);
  const unknownVars = useMemo(() => usedVars.filter((v) => !expectedVars.includes(v)), [usedVars, expectedVars]);
  const missingVars = useMemo(() => expectedVars.filter((v) => !usedVars.includes(v)), [usedVars, expectedVars]);

  // Keep preview var keys in sync with expectedVars while preserving user input
  useEffect(() => {
    setPreviewVars((prev) => {
      const next: Record<string, string> = { ...prev };
      // Add missing keys
      for (const k of expectedVars) if (!(k in next)) next[k] = "";
      // Remove keys that are no longer expected
      for (const k of Object.keys(next)) if (!expectedVars.includes(k)) delete next[k];
      return next;
    });
  }, [expectedVars]);

  // Build nested context object from flat previewVars using dot-paths
  function setPath(obj: any, path: string, value: any) {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      const raw = parts[i];
      const isIndex = /^\d+$/.test(raw);
      const key: any = isIndex ? Number(raw) : raw;
      const isLast = i === parts.length - 1;
      if (isLast) {
        cur[key] = value;
      } else {
        if (!(key in cur) || cur[key] == null || (typeof cur[key] !== "object")) {
          // create next container: array if next token is numeric, else object
          const nextIsIndex = /^\d+$/.test(parts[i + 1] || "");
          cur[key] = nextIsIndex ? [] : {};
        }
        cur = cur[key];
      }
    }
  }

  const previewContext = useMemo(() => {
    const ctx: Record<string, any> = {};
    for (const [name, value] of Object.entries(previewVars)) {
      if (value === "") continue; // skip empty values to exercise missing policy
      setPath(ctx, name, value);
    }
    return ctx;
  }, [previewVars]);

  const previewResult = useMemo(() => {
    try {
      const res = renderTemplate(draft || "", previewContext, { onMissing: missingPolicy });
      let processedText = res.rendered;
      
      // Apply excerpt modes
      if (previewMode !== "full" && processedText) {
        const lines = processedText.split('\n');
        switch (previewMode) {
          case "head":
            processedText = lines.slice(0, previewLines).join('\n');
            if (lines.length > previewLines) {
              processedText += `\n\n[... ${lines.length - previewLines} more lines]`;
            }
            break;
          case "tail":
            if (lines.length > previewLines) {
              processedText = `[... ${lines.length - previewLines} lines above]\n\n` + lines.slice(-previewLines).join('\n');
            }
            break;
          case "custom": {
            const start = Math.max(0, previewCustomStart - 1);
            const end = Math.min(lines.length, previewCustomEnd);
            if (start > 0) {
              processedText = `[... ${start} lines above]\n\n`;
            } else {
              processedText = "";
            }
            processedText += lines.slice(start, end).join('\n');
            if (end < lines.length) {
              processedText += `\n\n[... ${lines.length - end} more lines]`;
            }
            break;
          }
        }
      }
      
      // Add metadata if enabled
      // PP-001: Append materialized context when feature flag is enabled
      if (ENABLE_CONTEXT_PREVIEW) {
        const ctxJoined = Object.values(materializedContent).filter(Boolean).join("\n\n");
        if (ctxJoined) {
          processedText += `\n\n--- Context Preview ---\n${ctxJoined}`;
        }
      }
      let metadata = "";
      if (includeTokenCount) {
        metadata += `\n\n--- Preview Metadata ---\nEstimated tokens: ${tokenCount}`;
      }
      // Compute model targets locally to avoid temporal dead zone on parsedTargets
      const localParsedTargets = modelTargetsInput
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s, idx, arr) => s.length > 0 && arr.indexOf(s) === idx);
      if (includeModelTargets && localParsedTargets.length > 0) {
        metadata += `\nModel targets: ${localParsedTargets.join(", ")}`;
      }
      if (includeVariables && expectedVars.length > 0) {
        metadata += `\nVariables (${expectedVars.length}): ${expectedVars.join(", ")}`;
      }
      
      return { 
        text: processedText + metadata, 
        error: null as string | null, 
        missing: res.meta.variablesMissing 
      };
    } catch (e: any) {
      return { text: "", error: e?.message || String(e), missing: [] as string[] };
    }
  }, [draft, previewContext, missingPolicy, previewMode, previewLines, previewCustomStart, previewCustomEnd, includeVariables, includeTokenCount, includeModelTargets, tokenCount, modelTargetsInput, expectedVars, ENABLE_CONTEXT_PREVIEW, materializedContent]); // dependencies updated: removed parsedTargets; using modelTargetsInput and context preview flag

  const lineCount = useMemo(() => (draft ? draft.split(/\r?\n/).length : 0), [draft]);
  const charCount = draft.length;

  const estimatedCost = useMemo(() => {
    const price = parseFloat(pricePerK);
    return estimateCost(tokenCount, price);
  }, [pricePerK, tokenCount]);

  function parseModelTargets(input: string): string[] {
    return input
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s, idx, arr) => s.length > 0 && arr.indexOf(s) === idx);
  }

  // Model target validation and helpers
  // eslint-disable-next-line no-unused-vars
  function isValidTarget(t: string): boolean {
    return /^(gpt|claude|gemini|mistral|llama|llama3|deepseek|ollama:)/i.test(t);
  }

  // Validation states for model targets
  const parsedTargets = useMemo(() => parseModelTargets(modelTargetsInput), [modelTargetsInput]);
  const invalidTargets = useMemo(() => parsedTargets.filter(t => !isValidTarget(t)), [parsedTargets]);
  const hasValidationErrors = invalidTargets.length > 0;

  function removeTarget(t: string) {
    const next = parseModelTargets(modelTargetsInput).filter((x) => x !== t);
    setModelTargetsInput(next.join(", "));
  }

  function addTarget(t: string) {
    const next = parseModelTargets(modelTargetsInput);
    if (!next.includes(t)) next.push(t);
    setModelTargetsInput(next.join(", "));
  }

  // Preset pricing for common models (defaults; update as needed)
  const MODEL_PRESETS: { id: string; pricePerK: number; label?: string }[] = [
    { id: "gpt-4o", pricePerK: 0.01 },
    { id: "gpt-4o-mini", pricePerK: 0.003 },
    { id: "gpt-4.1", pricePerK: 0.02 },
    { id: "claude-3.5-sonnet", pricePerK: 0.015 },
    { id: "claude-3.5-haiku", pricePerK: 0.005 },
    { id: "gemini-1.5-pro", pricePerK: 0.01 },
    { id: "gemini-1.5-flash", pricePerK: 0.003 },
    { id: "mistral-large", pricePerK: 0.003 },
    { id: "llama3.1-70b", pricePerK: 0.002 },
    { id: "llama3.1-8b", pricePerK: 0.0005 },
  ];

  const [addPresetToTargets, setAddPresetToTargets] = useState<boolean>(true);

  const targetSuggestions = useMemo(
    () => [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4.1",
      "claude-3.5-sonnet",
      "claude-3.5-haiku",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "mistral-large",
      "llama3.1-70b",
      "llama3.1-8b",
      "deepseek-reasoner",
      "ollama:llama3.1",
    ],
    []
  );

  const lastTargetQuery = useMemo(() => {
    const parts = modelTargetsInput.split(",");
    return parts[parts.length - 1]?.trim() || "";
  }, [modelTargetsInput]);

  const autoComplete = useMemo(
    () =>
      targetSuggestions
        .filter((t) => t.toLowerCase().startsWith(lastTargetQuery.toLowerCase()))
        .filter((t) => !parsedTargets.includes(t))
        .slice(0, 6),
    [lastTargetQuery, parsedTargets, targetSuggestions]
  );

  const saveNewVersion = useCallback(async () => {
    if (!draft.trim()) {
      // local toast error
      setToast({ type: "error", message: "Content cannot be empty" });
      setTimeout(() => setToast(null), 2500);
      return;
    }
    if (invalidTargets.length > 0) {
      setToast({ type: "error", message: `Fix invalid targets: ${invalidTargets.join(", ")}` });
      setTimeout(() => setToast(null), 2500);
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/prompts/${promptId}/versions`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ content: draft, changelog: changelog || null, model_targets: parsedTargets }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || `Failed to save (${res.status})`);
      }
      // Optimistically show Saved badge and clear autosave via hook API
      autosave.onManualSaveSuccess();

      await loadData(promptId);
      setChangelog("");
      // Hook already cleared autosave storage

      setToast({ type: "success", message: "Version saved" });
      setTimeout(() => setToast(null), 2000);
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed to save" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [draft, changelog, parsedTargets, promptId, loadData, invalidTargets, autosave]);

  // Discard changes
  const onDiscard = useCallback(() => {
    if (!isDirty) return;
    if (typeof window !== "undefined" && !window.confirm("Discard unsaved changes?")) return;
    setDraft(baseContent);
    setChangelog("");
    try { autosave.clear(); } catch (e) { /* no-op */ }
    setRecoverInfo(null);
  }, [isDirty, baseContent, autosave]);

  // Insert helper for copy-block-to-draft
  function insertAtCursor(text: string) {
    const el = editorRef.current;
    const insertion = text.endsWith("\n") ? text : text + "\n";
    if (!el) {
      setDraft((d) => d + insertion);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + insertion + draft.slice(end);
    setDraft(next);
    setTimeout(() => {
      if (editorRef.current) {
        const pos = start + insertion.length;
        editorRef.current.selectionStart = editorRef.current.selectionEnd = pos;
        editorRef.current.focus();
      }
    }, 0);
  }


  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving) saveNewVersion();
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        onDiscard();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onDiscard, saveNewVersion]);

  const diffStats = useMemo(() => {
    let adds = 0, removes = 0, replaces = 0;
    diff.forEach((d) => {
      if (d.type === "added") adds++;
      else if (d.type === "removed") removes++;
      else if (d.type === "replace") replaces++;
    });
    return { adds, removes, replaces };
  }, [diff]);

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Toast */}
      {toast ? (
        <div
          className={`fixed right-4 top-4 z-50 rounded-md border px-3 py-2 text-sm shadow-sm ${toast.type === "success" ? "border-emerald-300/50 bg-emerald-50 text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-200" : "border-red-300/50 bg-red-50 text-red-800 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-200"}`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Prompt Studio</h1>
          <p className="text-sm opacity-70">Design, version, and diff your prompts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/library" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Library
          </Link>
          <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Home
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 opacity-80">Loading…</div>
      ) : error ? (
        <div className="rounded-lg border border-red-300/40 bg-red-50/40 p-4 text-red-700 dark:border-red-700/40 dark:bg-red-900/10 dark:text-red-300">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-12">
          {/* Version Timeline */}
          <section className="md:col-span-3 rounded-lg border border-neutral-200/30 bg-white p-3 dark:border-neutral-700/40 dark:bg-neutral-900" data-testid="version-timeline">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium opacity-80" id="versions-heading">Versions</h2>
              <span className="text-xs opacity-60">{versions.length}</span>
            </div>
            <ul className="space-y-1" role="listbox" aria-labelledby="versions-heading">
              {versions.map((v) => (
                <li key={v.id}>
                  <button
                    className={`w-full rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      selectedVersion === v.version
                        ? "bg-blue-100/70 dark:bg-blue-900/30"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                    onClick={() => setSelectedVersion(v.version)}
                    title={v.changelog || undefined}
                    data-testid={`version-item-${v.version}`}
                    data-selected={selectedVersion === v.version}
                    role="option"
                    aria-selected={selectedVersion === v.version}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">v{v.version}</span>
                      <span className="text-xs opacity-60">{new Date(v.created_at).toLocaleString()}</span>
                    </div>
                    {v.changelog ? (
                      <div className="mt-0.5 text-xs opacity-70 line-clamp-2">{v.changelog}</div>
                    ) : null}
                    {v.model_targets?.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {v.model_targets.map((t) => (
                          <span key={t} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{t}</span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                </li>
              ))}
              {versions.length === 0 ? <li className="text-sm opacity-60">No versions yet</li> : null}
            </ul>
          </section>

          {/* Editor */}
          <section className="md:col-span-5 rounded-lg border border-neutral-200/30 bg-white p-3 dark:border-neutral-700/40 dark:bg-neutral-900">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-sm font-medium opacity-80">Editor</h2>
                  <p className="text-xs opacity-60">{prompt?.name}</p>
                </div>
                <AutosaveBadge status={autosave.status} ts={autosave.ts ?? null} />
              </div>
              {isDirty ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                  Unsaved changes
                </span>
              ) : null}
            </div>
            {recoverInfo ? (
              <div className="mb-2 flex items-center justify-between rounded-md border border-amber-300/60 bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
                <span>Autosaved draft from {new Date(recoverInfo.ts).toLocaleString()} found.</span>
                <div className="flex items-center gap-2">
                  <button className="rounded bg-amber-600 px-2 py-0.5 text-white hover:bg-amber-700" onClick={() => { setDraft(recoverInfo.draft); setRecoverInfo(null); }}>
                    Restore
                  </button>
                  <button className="rounded border border-amber-400 px-2 py-0.5 hover:bg-amber-100 dark:hover:bg-amber-900/30" onClick={() => { autosave.clear(); setRecoverInfo(null); }}>
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}

            <details className="mb-2 rounded-md border border-neutral-200/50 bg-white p-2 text-xs open:shadow-sm dark:border-neutral-700/50 dark:bg-neutral-950" data-testid="token-insights">
              <summary className="cursor-pointer select-none list-none font-medium opacity-80">
                Token Insights
                <span className="ml-2 font-normal opacity-70">Tokens≈ <span className="font-mono">{tokenCount}</span></span>
                <span className="ml-2 font-normal opacity-70">
                  Est. cost: <span className="font-mono">{formatUsd(estimatedCost, 4)}</span>
                </span>
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div data-testid="ti-lines">Lines: <span className="font-mono">{lineCount}</span></div>
                <div data-testid="ti-chars">Chars: <span className="font-mono">{charCount}</span></div>
                <div data-testid="ti-tokens">Tokens≈ <span className="font-mono">{tokenCount}</span></div>
                <div className="col-span-2 sm:col-span-1" data-testid="ti-cost">
                  {estimatedCost != null ? (
                    <span>Est. cost: <span className="font-mono">{formatUsd(estimatedCost, 4)}</span></span>
                  ) : (
                    <span className="opacity-70">Tip: set $/1K tokens to estimate cost</span>
                  )}
                </div>
                {expectedVars.length > 0 ? (
                  <div className="col-span-2 sm:col-span-3" data-testid="ti-vars">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        Vars: <span className="font-mono">{expectedVars.length}</span>
                      </span>
                      {unknownVars.length > 0 && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] text-red-800 dark:bg-red-900/30 dark:text-red-200" title={`Unknown: ${unknownVars.join(', ')}`}>
                          Unknown: {unknownVars.join(', ')}
                        </span>
                      )}
                      {missingVars.length > 0 && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" title={`Missing: ${missingVars.join(', ')}`}>
                          Missing: {missingVars.join(', ')}
                        </span>
                      )}
                      {unknownVars.length === 0 && missingVars.length === 0 && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Vars OK</span>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </details>
            
            <textarea
              ref={editorRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write your prompt here…"
              className="h-72 w-full resize-y rounded-md border border-neutral-300/50 bg-neutral-50 p-2 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-900"
              data-testid="editor-input"
            />
            
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div data-testid="token-insights-inline" className="flex flex-wrap items-center gap-3 text-xs opacity-80">
                <span data-testid="ti-lines-inline">
                  Lines: <span className="font-mono">{lineCount}</span>
                </span>
                <span data-testid="ti-chars-inline">
                  Chars: <span className="font-mono">{charCount}</span>
                </span>
                <span data-testid="ti-tokens-inline" title="Approximate tokens (heuristic)">
                  Tokens≈ <span className="font-mono">{tokenCount}</span>
                </span>
                {estimatedCost != null ? (
                  <span data-testid="ti-cost-inline">
                    Est. cost: <span className="font-mono">{formatUsd(estimatedCost, 4)}</span>
                  </span>
                ) : (
                  <span className="opacity-60">Set price/1K for cost</span>
                )}
                {unknownVars.length > 0 || missingVars.length > 0 ? (
                  <span data-testid="ti-vars-inline" className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-red-800 dark:bg-red-900/30 dark:text-red-200" title={`Unknown: ${unknownVars.join(', ')} | Missing: ${missingVars.join(', ')}`}>
                    Var issues
                  </span>
                ) : expectedVars.length > 0 ? (
                  <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Vars OK</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs opacity-70" htmlFor="pricePerK">
                  $/1K tokens
                </label>
                <input
                  id="pricePerK"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputMode="decimal"
                  value={pricePerK}
                  onChange={(e) => setPricePerK(e.target.value)}
                  placeholder="e.g. 0.005"
                  className="w-28 rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                />
                {/* Model preset selector */}
                <label className="ml-3 text-xs opacity-70" htmlFor="modelPresetSelect">
                  Model preset
                </label>
                <select
                  id="modelPresetSelect"
                  className="rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                  defaultValue=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const preset = MODEL_PRESETS.find((p) => p.id === id);
                    if (!preset) return;
                    setPricePerK(String(preset.pricePerK));
                    if (addPresetToTargets) addTarget(id);
                    // reset back to placeholder after applying
                    e.currentTarget.value = "";
                  }}
                  title="Select a preset to autofill price and optionally add to targets"
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
                <label htmlFor="addPresetToTargets" className="ml-2 inline-flex items-center gap-1 text-xs opacity-70">
                  <input
                    id="addPresetToTargets"
                    type="checkbox"
                    checked={addPresetToTargets}
                    onChange={(e) => setAddPresetToTargets(e.target.checked)}
                    className="h-3 w-3 rounded border-neutral-300 text-blue-600 focus:ring-blue-400 dark:border-neutral-700"
                  />
                  Add to targets
                </label>
              </div>
            </div>
            
            {/* Model targets input */}
            <div className="mt-3">
              <label htmlFor="modelTargets" className="mb-1 block text-xs font-medium opacity-80">
                Model targets (chips; Enter or comma to add)
              </label>
              {hasValidationErrors ? (
                <div className="mb-1 text-[11px] text-red-600 dark:text-red-400" role="alert">
                  Invalid targets: {invalidTargets.join(", ")}. Allowed prefixes: gpt, claude, gemini, mistral, llama, llama3, deepseek, ollama:
                </div>
              ) : null}
              <input
                id="modelTargets"
                type="text"
                value={modelTargetsInput}
                onChange={(e) => setModelTargetsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "," || e.key === "Enter") {
                    e.preventDefault();
                    const q = lastTargetQuery;
                    if (q) addTarget(q);
                  }
                }}
                placeholder="e.g. gpt-4o, claude-3.5-sonnet"
                className="w-full rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                aria-invalid={hasValidationErrors}
                aria-describedby={hasValidationErrors ? "modelTargets-error" : undefined}
                 data-testid="model-targets-input"
              />
              {autoComplete.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {autoComplete.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTarget(t)}
                      className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      data-testid="add-target"
                      data-value={t}
                      title={`Add ${t}`}
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              ) : null}
              {parsedTargets.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {parsedTargets.map((t) => (
                    <span
                      key={t}
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ${invalidTargets.includes(t) ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"}`}
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTarget(t)}
                        aria-label={`Remove ${t}`}
                        className="rounded px-1 text-xs leading-none transition-colors hover:bg-blue-200/70 dark:hover:bg-blue-800/60"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          {/* Live Preview */}
          <section className="md:col-span-4 rounded-lg border border-neutral-200/30 bg-white p-3 dark:border-neutral-700/40 dark:bg-neutral-900" data-testid="preview-panel">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium opacity-80">Live Preview</h2>
                {previewResult.error ? (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] text-red-800 dark:bg-red-900/30 dark:text-red-200">Error</span>
                ) : previewResult.missing && previewResult.missing.length > 0 ? (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" title={`Missing: ${previewResult.missing.join(', ')}`}>Missing vars: {previewResult.missing.length}</span>
                ) : (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">OK</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="opacity-70" htmlFor="missingPolicy">Missing vars</label>
                <select
                  id="missingPolicy"
                  data-testid="preview-policy"
                  value={missingPolicy}
                  onChange={(e) => setMissingPolicy(e.target.value as any)}
                  className="rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                  title="How to handle missing variables in preview"
                >
                  <option value="annotate">Annotate</option>
                  <option value="leave">Leave placeholder</option>
                  <option value="empty">Replace with empty</option>
                  <option value="error">Throw error</option>
                </select>
                <button
                  type="button"
                  className="rounded-md border border-neutral-300/60 px-2 py-1 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
                  onClick={() => setPreviewVars(prev => Object.fromEntries(Object.keys(prev).map(k => [k, ""])))}
                  title="Clear all variable values"
                >
                  Reset values
                </button>
                <button
                  type="button"
                  data-testid="preview-copy"
                  aria-label="Copy preview output"
                  className="rounded-md border border-neutral-300/60 px-2 py-1 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(previewResult.text || "");
                    } catch (e) {
                      console.error("Failed to copy preview output", e);
                    }
                  }}
                  title="Copy preview output to clipboard"
                >
                  Copy output
                </button>
              </div>
            </div>

            {ENABLE_CONTEXT_PREVIEW && (
              <>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide opacity-70" aria-label="Context Preview section">Context Preview</h3>
                {/* PP-001: Token HUD */}
                <div data-testid="token-hud" aria-live="polite" className="mb-3 rounded-md border border-neutral-200/60 bg-neutral-50 p-2 text-xs dark:border-neutral-700/50 dark:bg-neutral-950">
                  <span className="font-medium">Tokens:</span> <span className="font-mono">{hudTokenCount}</span>
                </div>

                {/* PP-001: Context File List (stateful) */}
                <div data-testid="context-file-list" className="mb-3 max-h-48 overflow-auto rounded-md border border-neutral-200/60 dark:border-neutral-700/50">
                  {contextFiles.map((f) => {
                    const pref = filePrefs[f.id] || { include: true, mode: "head" as ExcerptMode, start: 1, end: 10 };
                    return (
                      <div key={f.id} data-testid="context-file-row" className="flex items-center justify-between gap-2 border-b border-neutral-200/50 p-2 text-xs last:border-b-0 dark:border-neutral-700/40">
                        <div className="flex min-w-0 items-center gap-3">
                          <label className="inline-flex items-center gap-1 shrink-0">
                            <input
                              type="checkbox"
                              data-testid="include-toggle"
                              checked={!!pref.include}
                              onChange={(e) => updatePref(f.id, { include: e.target.checked })}
                              className="h-3 w-3 text-blue-600"
                              aria-label={`Include ${f.name}`}
                            />
                            <span className="opacity-80">Include</span>
                          </label>
                          <span className="truncate" title={f.name}>{f.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            data-testid="excerpt-mode-select"
                            value={pref.mode}
                            onChange={(e) => updatePref(f.id, { mode: e.target.value as ExcerptMode })}
                            className="rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                            aria-label={`Excerpt mode for ${f.name}`}
                          >
                            <option value="head">head</option>
                            <option value="tail">tail</option>
                            <option value="custom">custom</option>
                          </select>
                          {pref.mode === "custom" && (
                            <>
                              <input
                                data-testid="excerpt-start"
                                type="number"
                                min={1}
                                value={pref.start}
                                onChange={(e) => updatePref(f.id, { start: parseInt(e.target.value) || 1 })}
                                className="w-16 rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                                aria-label={`Custom start line for ${f.name}`}
                              />
                              <input
                                data-testid="excerpt-end"
                                type="number"
                                min={1}
                                value={pref.end}
                                onChange={(e) => updatePref(f.id, { end: parseInt(e.target.value) || pref.start || 10 })}
                                className="w-16 rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                                aria-label={`Custom end line for ${f.name}`}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Variable inputs */}
            <div className="mb-3">
              {expectedVars.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {expectedVars.map((name) => (
                    <label key={name} className="flex flex-col gap-1 text-xs">
                      <span className="opacity-70">{name}</span>
                      <input
                        data-testid={`preview-var-input-${name}`}
                        type="text"
                        value={previewVars[name] ?? ""}
                        onChange={(e) => setPreviewVars((prev) => ({ ...prev, [name]: e.target.value }))}
                        placeholder={`Value for ${name}`}
                        className="rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-xs opacity-70">No variables referenced in this prompt.</div>
              )}
            </div>

            {/* Preview Controls */}
            <div className="mb-3 space-y-2">
              {/* Excerpt Mode Controls */}
              <div className="flex items-center gap-4 text-xs">
                <label className="opacity-70">View mode:</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="previewMode"
                      value="full"
                      checked={previewMode === "full"}
                      onChange={(e) => setPreviewMode(e.target.value as any)}
                      className="text-blue-600"
                    />
                    <span>Full</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="previewMode"
                      value="head"
                      checked={previewMode === "head"}
                      onChange={(e) => setPreviewMode(e.target.value as any)}
                      className="text-blue-600"
                    />
                    <span>Head</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="previewMode"
                      value="tail"
                      checked={previewMode === "tail"}
                      onChange={(e) => setPreviewMode(e.target.value as any)}
                      className="text-blue-600"
                    />
                    <span>Tail</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="previewMode"
                      value="custom"
                      checked={previewMode === "custom"}
                      onChange={(e) => setPreviewMode(e.target.value as any)}
                      className="text-blue-600"
                    />
                    <span>Custom</span>
                  </label>
                </div>
              </div>

              {/* Lines Control for Head/Tail */}
              {(previewMode === "head" || previewMode === "tail") && (
                <div className="flex items-center gap-2 text-xs">
                  <label className="opacity-70">Lines:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={previewLines}
                    onChange={(e) => setPreviewLines(parseInt(e.target.value) || 10)}
                    className="w-16 rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                  />
                </div>
              )}

              {/* Custom Range Controls */}
              {previewMode === "custom" && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="opacity-70">From line:</label>
                    <input
                      type="number"
                      min="1"
                      value={previewCustomStart}
                      onChange={(e) => setPreviewCustomStart(parseInt(e.target.value) || 1)}
                      className="w-16 rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="opacity-70">To line:</label>
                    <input
                      type="number"
                      min="1"
                      value={previewCustomEnd}
                      onChange={(e) => setPreviewCustomEnd(parseInt(e.target.value) || 10)}
                      className="w-16 rounded-md border border-neutral-300/50 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                    />
                  </div>
                </div>
              )}

              {/* Include/Exclude Toggles */}
              <div className="flex items-center gap-4 text-xs">
                <label className="opacity-70">Include:</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={includeVariables}
                      onChange={(e) => setIncludeVariables(e.target.checked)}
                      className="text-blue-600"
                    />
                    <span>Variables</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={includeTokenCount}
                      onChange={(e) => setIncludeTokenCount(e.target.checked)}
                      className="text-blue-600"
                    />
                    <span>Token count</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={includeModelTargets}
                      onChange={(e) => setIncludeModelTargets(e.target.checked)}
                      className="text-blue-600"
                    />
                    <span>Model targets</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Preview result */}
            {previewResult.error ? (
              <div className="mb-2 rounded-md border border-red-300/50 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-200" role="alert">
                {previewResult.error}
              </div>
            ) : null}

            {previewResult.missing && previewResult.missing.length > 0 ? (
              <div className="mb-2 rounded-md border border-amber-300/50 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
                Missing in preview: <span className="font-mono">{previewResult.missing.join(', ')}</span>
              </div>
            ) : null}

            <div className="rounded-md border border-neutral-200/50 bg-neutral-50 p-2 dark:border-neutral-700/50 dark:bg-neutral-950">
              <pre data-testid="preview-output" className="max-h-80 overflow-auto whitespace-pre-wrap font-mono text-sm">{previewResult.text}</pre>
            </div>
          </section>

          {/* Right Panel - Diff & Changelog */}
          <section className="md:col-span-12 rounded-lg border border-neutral-200/30 bg-white p-3 dark:border-neutral-700/40 dark:bg-neutral-900" data-testid="diff-panel">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium opacity-80">Diff & Changelog</h2>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md border border-neutral-300/60 px-2 py-1 text-xs hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
                  onClick={onDiscard}
                  disabled={!isDirty || saving}
                  title={!isDirty ? "No changes" : "Discard unsaved changes"}
                   data-testid="btn-discard"
                >
                  Discard
                </button>
                <button
                  className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                  onClick={saveNewVersion}
                  disabled={!isDirty || saving || hasValidationErrors}
                  title={hasValidationErrors ? `Resolve invalid targets: ${invalidTargets.join(", ")}` : undefined}
                   data-testid="btn-save"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {/* Diff controls */}
            <div className="mb-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <label className="flex items-center gap-1">
                <input
                  data-testid="diff-hide-unchanged"
                  type="checkbox"
                  checked={hideUnchanged}
                  onChange={(e) => setHideUnchanged(e.target.checked)}
                />
                <span>Hide unchanged</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  data-testid="diff-word-level"
                  type="checkbox"
                  checked={wordLevel}
                  onChange={(e) => setWordLevel(e.target.checked)}
                />
                <span>Word-level</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  data-testid="diff-side-by-side"
                  type="checkbox"
                  checked={sideBySide}
                  onChange={(e) => setSideBySide(e.target.checked)}
                />
                <span>Side-by-side</span>
              </label>
              <label className="flex items-center gap-1">
                <span>Context radius</span>
                <select
                  data-testid="diff-context-radius"
                  aria-label="Context radius"
                  value={String(contextRadius)}
                  onChange={(e) => setContextRadius(parseInt(e.target.value, 10))}
                  className="w-20 rounded-md border border-neutral-300/50 bg-white px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                >
                  {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Diff stats */}
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs opacity-80">
              <span data-testid="diff-stats-added" className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">+{diffStats.adds} added</span>
              <span data-testid="diff-stats-removed" className="rounded bg-red-100 px-1.5 py-0.5 text-red-800 dark:bg-red-900/30 dark:text-red-200">-{diffStats.removes} removed</span>
              <span data-testid="diff-stats-modified" className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">~{diffStats.replaces} modified</span>
            </div>

            {/* Diff view */}
            <div className="mb-3 max-h-80 overflow-auto rounded-md border border-neutral-200/50 bg-neutral-50 p-2 font-mono text-[12px] leading-5 dark:border-neutral-700/50 dark:bg-neutral-950" data-testid="diff-root">
              {diff.length === 0 ? (
                <div className="opacity-60">No differences</div>
              ) : sideBySide ? (
                <div className="grid grid-cols-2 gap-2" data-testid="diff-sbs">
                  <div className="text-xs opacity-70">Base</div>
                  <div className="text-xs opacity-70">Draft</div>
                  {filteredDiffIndices.map((i) => {
                    const d = diff[i];
                    if (d.type === "unchanged") {
                      return (
                        <React.Fragment key={i}>
                          <div className="col-span-1 whitespace-pre-wrap rounded bg-white px-2 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">{d.text || "\u00A0"}</div>
                          <div className="col-span-1 whitespace-pre-wrap rounded bg-white px-2 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">{d.text || "\u00A0"}</div>
                        </React.Fragment>
                      );
                    }
                    if (d.type === "removed") {
                      return (
                        <React.Fragment key={i}>
                          <div className="col-span-1 whitespace-pre-wrap rounded bg-red-50 px-2 text-red-800 dark:bg-red-900/20 dark:text-red-200">{d.text}</div>
                          <div className="col-span-1 whitespace-pre-wrap rounded bg-white px-2 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">&nbsp;</div>
                        </React.Fragment>
                      );
                    }
                    if (d.type === "added") {
                      return (
                        <React.Fragment key={i}>
                          <div className="col-span-1 whitespace-pre-wrap rounded bg-white px-2 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">&nbsp;</div>
                          <div className="col-span-1 flex items-start justify-between gap-2 whitespace-pre-wrap rounded bg-emerald-50 px-2 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                            <div className="flex-1">{d.text}</div>
                            <button
                              data-testid="diff-insert"
                              className="shrink-0 rounded border border-emerald-400 px-1.5 py-0.5 text-[11px] hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                              onClick={() => insertAtCursor(d.text)}
                            >
                              Insert
                            </button>
                          </div>
                        </React.Fragment>
                      );
                    }
                    // replace
                    const d_replace = d as Extract<DiffLine, { type: "replace" }>;
                    const oldText = d_replace.oldText;
                    const newText = d_replace.newText;
                    return (
                      <React.Fragment key={i}>
                        <div className="col-span-1 whitespace-pre-wrap rounded bg-amber-50 px-2 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                          {wordLevel
                            ? diffWords(oldText, newText).map((s, idx) => (
                                <span key={idx} className={s.t === "-" ? "bg-red-200/60 dark:bg-red-800/40" : s.t === "+" ? "opacity-50" : undefined}>{s.text}</span>
                              ))
                            : oldText}
                        </div>
                        <div className="col-span-1 whitespace-pre-wrap rounded bg-amber-50 px-2 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                          {wordLevel
                            ? diffWords(oldText, newText).map((s, idx) => (
                                <span key={idx} className={s.t === "+" ? "bg-emerald-200/60 dark:bg-emerald-800/40" : s.t === "-" ? "bg-red-200/60 dark:bg-red-800/40" : undefined}>{s.text}</span>
                              ))
                            : newText}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1" data-testid="diff-unified">
                  {filteredDiffIndices.map((i) => {
                    const d = diff[i];
                    if (d.type === "unchanged") {
                      return (
                        <div key={i} className="whitespace-pre-wrap rounded bg-white px-2 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">{d.text || "\u00A0"}</div>
                      );
                    }
                    if (d.type === "removed") {
                      return (
                        <div key={i} className="whitespace-pre-wrap rounded bg-red-50 px-2 text-red-800 dark:bg-red-900/20 dark:text-red-200">- {d.text}</div>
                      );
                    }
                    if (d.type === "added") {
                      return (
                        <div key={i} className="flex items-start justify-between gap-2 whitespace-pre-wrap rounded bg-emerald-50 px-2 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                          <div className="flex-1">+ {d.text}</div>
                          <button
                            className="shrink-0 rounded border border-emerald-400 px-1.5 py-0.5 text-[11px] hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                            onClick={() => insertAtCursor(d.text)}
                          >
                            Insert
                          </button>
                        </div>
                      );
                    }
                    // replace
                    const d_replace = d as Extract<DiffLine, { type: "replace" }>;
                    const oldText = d_replace.oldText;
                    const newText = d_replace.newText;
                    return (
                      <div key={i} className="whitespace-pre-wrap rounded bg-amber-50 px-2 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                        {wordLevel
                          ? (
                            <>
                              {oldText}
                              <br />
                              {newText}
                            </>
                          )
                          : (
                            <>
                              <span aria-hidden="true">- </span>{oldText}
                              <br />
                              <span aria-hidden="true">+ </span>{newText}
                            </>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Changelog editor */}
            <div className="space-y-1">
              <label className="text-xs opacity-70" htmlFor="changelogInput">Changelog</label>
              <textarea
                id="changelogInput"
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="Describe what changed and why…"
                className="h-24 w-full resize-y rounded-md border border-neutral-300/50 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 dark:border-neutral-700/50 dark:bg-neutral-950"
                data-testid="changelog-input"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  data-testid="changelog-clear"
                  className="rounded-md border border-neutral-300/60 px-2 py-1 text-xs hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
                  onClick={() => setChangelog("")}
                  disabled={changelog.length === 0}
                >
                  Clear
                </button>
                <button
                  className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                  onClick={saveNewVersion}
                  disabled={!isDirty || saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}