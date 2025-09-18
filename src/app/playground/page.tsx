"use client";
import React from "react";
import Link from "next/link";
import { estimateTokens, estimateCost } from "@/lib/token-estimator";
import { assembleContext } from "@/lib/context-builder";
import type { ContextItem } from "@/lib/context-builder";
import { formatUsd } from "@/lib/format";

// Local price map mirrors Inventory presets for simple cost estimation
const MODEL_PRESETS: Array<{ id: string; label: string; pricePerK: number }> = [
  { id: "gpt-4o-mini", label: "GPT-4o mini", pricePerK: 0.15 },
  { id: "gpt-4o", label: "GPT-4o", pricePerK: 5.0 },
  { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", pricePerK: 3.0 },
  { id: "o3-mini", label: "OpenAI o3-mini", pricePerK: 1.1 },
];

function priceFor(model: string): number {
  return MODEL_PRESETS.find((m) => m.id === model)?.pricePerK ?? 2.0;
}

type RunResult = {
  model: string;
  output: string;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  costUsd: number | null;
  elapsedMs: number;
};

export default function PlaygroundPage() {
  const [model, setModel] = React.useState<string>(MODEL_PRESETS[0].id);
  const [temperature, setTemperature] = React.useState<number>(0.7);
  const [prompt, setPrompt] = React.useState<string>("You are a helpful assistant. Summarize in 3 bullet points: Why testing E2E matters.");

  const [injectContext, setInjectContext] = React.useState<boolean>(true);
  const [contextPreviewOpen, setContextPreviewOpen] = React.useState<boolean>(false);
  const [contextText, setContextText] = React.useState<string>("");
  const [fmt, setFmt] = React.useState<"text" | "xml">("text");

  const [useStreaming, setUseStreaming] = React.useState<boolean>(false);

  const [leftLoading, setLeftLoading] = React.useState<boolean>(false);
  const [rightLoading, setRightLoading] = React.useState<boolean>(false);
  const [leftResult, setLeftResult] = React.useState<RunResult | null>(null);
  const [rightResult, setRightResult] = React.useState<RunResult | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string>("");

  // Streaming state
  const [leftStreamOutput, setLeftStreamOutput] = React.useState("");
  const [rightStreamOutput, setRightStreamOutput] = React.useState("");
  const [leftStreamTokensIn, setLeftStreamTokensIn] = React.useState<number | null>(null);
  const [rightStreamTokensIn, setRightStreamTokensIn] = React.useState<number | null>(null);
  const [leftStreamTokensOut, setLeftStreamTokensOut] = React.useState<number>(0);
  const [rightStreamTokensOut, setRightStreamTokensOut] = React.useState<number>(0);
  const [leftElapsed, setLeftElapsed] = React.useState<number>(0);
  const [rightElapsed, setRightElapsed] = React.useState<number>(0);

  const leftESRef = React.useRef<EventSource | null>(null);
  const rightESRef = React.useRef<EventSource | null>(null);
  const leftTimerRef = React.useRef<number | null>(null);
  const rightTimerRef = React.useRef<number | null>(null);
  const leftOutputRef = React.useRef<string>("");
  const rightOutputRef = React.useRef<string>("");
  const leftTokensInRef = React.useRef<number>(0);
  const rightTokensInRef = React.useRef<number>(0);
  const leftStartRef = React.useRef<number>(0);
  const rightStartRef = React.useRef<number>(0);

  // Load Inventory context from localStorage (shared with Inventory page) for quick integration
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ctx.items");
      const f = (localStorage.getItem("ctx.fmt") as "text" | "xml") || "text";
      setFmt(f);
      if (raw) {
        const items = JSON.parse(raw) as ContextItem[];
        const text = assembleContext(items, f);
        setContextText(text);
      } else {
        setContextText("");
      }
    } catch (e) {
      // ignore parse errors in dev for smoother UX
    }
  }, []);

  // Cleanup any open streams and timers on unmount
  React.useEffect(() => {
    return () => {
      try { leftESRef.current?.close(); } catch (e) { void e; }
      try { rightESRef.current?.close(); } catch (e) { void e; }
      if (leftTimerRef.current) { clearInterval(leftTimerRef.current); leftTimerRef.current = null; }
      if (rightTimerRef.current) { clearInterval(rightTimerRef.current); rightTimerRef.current = null; }
    };
  }, []);

  const tokensInEst = React.useMemo(() => {
    const combined = prompt + (injectContext && contextText ? "\n\n" + contextText : "");
    return estimateTokens(combined);
  }, [prompt, injectContext, contextText]);

  const estCost = React.useMemo(() => {
    return estimateCost(tokensInEst, priceFor(model));
  }, [tokensInEst, model]);

  async function run(which: "left" | "right" | "both") {
    if (useStreaming) return stream(which);

    setErrorMsg("");
    const doLeft = which === "left" || which === "both";
    const doRight = which === "right" || which === "both";

    const payload = {
      model,
      temperature,
      prompt,
      context: injectContext ? contextText : "",
      options: {},
    };

    try {
      const runSide = async (side: "left" | "right") => {
        side === "left" ? setLeftLoading(true) : setRightLoading(true);
        const t0 = performance.now();
        const resp = await fetch("/api/prompt/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error(`Run failed (${resp.status})`);
        const data = (await resp.json()) as any;
        const elapsedMs = Math.round(performance.now() - t0);
        const result: RunResult = {
          model: data.model,
          output: data.output,
          tokensIn: data.tokensIn ?? 0,
          tokensOut: data.tokensOut ?? 0,
          totalTokens: (data.tokensIn ?? 0) + (data.tokensOut ?? 0),
          costUsd: data.cost ?? null,
          elapsedMs,
        };
        side === "left" ? setLeftResult(result) : setRightResult(result);
        side === "left" ? setLeftLoading(false) : setRightLoading(false);
      };

      const ops: Promise<void>[] = [];
      if (doLeft) ops.push(runSide("left"));
      if (doRight) ops.push(runSide("right"));
      await Promise.all(ops);
    } catch (e: any) {
      setLeftLoading(false);
      setRightLoading(false);
      setErrorMsg(e?.message || "Unexpected error during run");
    }
  }

  async function stream(which: "left" | "right" | "both") {
    setErrorMsg("");
    const doLeft = which === "left" || which === "both";
    const doRight = which === "right" || which === "both";

    const params = () => {
      const qs = new URLSearchParams();
      qs.set("model", model);
      qs.set("temperature", String(temperature));
      qs.set("prompt", prompt);
      qs.set("context", injectContext ? contextText : "");
      return qs.toString();
    };

    const stopTimers = (side: "left" | "right") => {
      if (side === "left") {
        if (leftTimerRef.current) { clearInterval(leftTimerRef.current); leftTimerRef.current = null; }
      } else {
        if (rightTimerRef.current) { clearInterval(rightTimerRef.current); rightTimerRef.current = null; }
      }
    };

    const closeES = (side: "left" | "right") => {
      try {
        if (side === "left") { leftESRef.current?.close(); leftESRef.current = null; }
        else { rightESRef.current?.close(); rightESRef.current = null; }
      } catch (e) { void e; }
    };

    const finalizeSide = (side: "left" | "right") => {
      stopTimers(side);
      const now = performance.now();
      if (side === "left") {
        closeES("left");
        const tokensIn = leftTokensInRef.current ?? 0;
        const output = leftOutputRef.current;
        const tokensOut = estimateTokens(output);
        const totalTokens = tokensIn + tokensOut;
        const elapsedMs = Math.round(now - leftStartRef.current);
        // Compute cost only at finalization; during streaming HUD shows placeholder
        const costUsd = Number(((totalTokens / 1000) * priceFor(model)).toFixed(4));
        const result: RunResult = { model, output, tokensIn, tokensOut, totalTokens, costUsd, elapsedMs };
        setLeftResult(result);
        setLeftLoading(false);
      } else {
        closeES("right");
        const tokensIn = rightTokensInRef.current ?? 0;
        const output = rightOutputRef.current;
        const tokensOut = estimateTokens(output);
        const totalTokens = tokensIn + tokensOut;
        const elapsedMs = Math.round(now - rightStartRef.current);
        const costUsd = Number(((totalTokens / 1000) * priceFor(model)).toFixed(4));
        const result: RunResult = { model, output, tokensIn, tokensOut, totalTokens, costUsd, elapsedMs };
        setRightResult(result);
        setRightLoading(false);
      }
    };

    const handleError = (side: "left" | "right", message: string) => {
      stopTimers(side);
      closeES(side);
      setErrorMsg(message);
      if (side === "left") setLeftLoading(false); else setRightLoading(false);
    };

    const startSide = (side: "left" | "right") => {
      // Reset side state
      if (side === "left") {
        setLeftResult(null);
        setLeftStreamOutput("");
        leftOutputRef.current = "";
        setLeftStreamTokensIn(null);
        leftTokensInRef.current = 0;
        setLeftStreamTokensOut(0);
        setLeftElapsed(0);
        leftStartRef.current = performance.now();
        setLeftLoading(true);
      } else {
        setRightResult(null);
        setRightStreamOutput("");
        rightOutputRef.current = "";
        setRightStreamTokensIn(null);
        rightTokensInRef.current = 0;
        setRightStreamTokensOut(0);
        setRightElapsed(0);
        rightStartRef.current = performance.now();
        setRightLoading(true);
      }

      const tick = () => {
        if (side === "left") {
          const ms = Math.round(performance.now() - leftStartRef.current);
          setLeftElapsed(ms);
        } else {
          const ms = Math.round(performance.now() - rightStartRef.current);
          setRightElapsed(ms);
        }
      };
      const timer = window.setInterval(tick, 100);
      if (side === "left") leftTimerRef.current = timer; else rightTimerRef.current = timer;

      const es = new EventSource(`/api/prompt/stream?${params()}`);
      if (side === "left") leftESRef.current = es; else rightESRef.current = es;

      es.onmessage = (ev) => {
        try {
          const chunk = JSON.parse(ev.data);
          if (chunk.type === "start") {
            if (typeof chunk.tokensIn === "number") {
              if (side === "left") { setLeftStreamTokensIn(chunk.tokensIn); leftTokensInRef.current = chunk.tokensIn; }
              else { setRightStreamTokensIn(chunk.tokensIn); rightTokensInRef.current = chunk.tokensIn; }
            }
          } else if (chunk.type === "delta") {
            if (typeof chunk.text === "string") {
              if (side === "left") {
                setLeftStreamOutput((prev) => {
                  const next = prev + chunk.text;
                  leftOutputRef.current = next;
                  setLeftStreamTokensOut(estimateTokens(next));
                  return next;
                });
              } else {
                setRightStreamOutput((prev) => {
                  const next = prev + chunk.text;
                  rightOutputRef.current = next;
                  setRightStreamTokensOut(estimateTokens(next));
                  return next;
                });
              }
            }
          } else if (chunk.type === "done") {
            finalizeSide(side);
          } else if (chunk.type === "error") {
            throw new Error(chunk.message || "Stream error");
          }
        } catch (err: any) {
          handleError(side, err?.message || "Stream parse error");
        }
      };

      es.onerror = () => {
        handleError(side, "Stream connection error");
      };
    };

    const ops: Array<() => void> = [];
    if (doLeft) ops.push(() => startSide("left"));
    if (doRight) ops.push(() => startSide("right"));
    ops.forEach((fn) => fn());
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-6" data-testid="playground-page">
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Prompt Playground</h1>
          <p className="text-sm opacity-70">Iterate prompts quickly. Compare outputs side-by-side. Context optional.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/inventory"
            prefetch={false}
            data-testid="nav-inventory"
            aria-label="Inventory"
            className="rounded-md border border-neutral-300/60 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700/60 dark:hover:bg-neutral-900"
          >
            Inventory
          </Link>
          <Link
            href="/templates"
            prefetch={false}
            className="rounded-md border border-neutral-300/60 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700/60 dark:hover:bg-neutral-900"
          >
            Templates
          </Link>
          <Link
            href="/"
            prefetch={false}
            className="rounded-md border border-neutral-300/60 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700/60 dark:hover:bg-neutral-900"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Controls */}
      <section className="mb-4 rounded-lg border border-neutral-200/50 p-4 dark:border-neutral-700/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="prompt" className="text-sm font-medium">Prompt</label>
            <textarea
              id="prompt"
              data-testid="prompt-input"
              className="min-h-[96px] w-full resize-y rounded-md border border-neutral-300/60 p-3 text-sm dark:border-neutral-700/60 dark:bg-neutral-900/20"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your instruction here..."
            />
          </div>
          <div className="grid w-full max-w-sm grid-cols-2 gap-3 sm:max-w-none sm:w-auto sm:grid-cols-4 sm:gap-4">
            <div className="flex flex-col">
              <label htmlFor="model" className="text-sm font-medium">Model</label>
              <select
                id="model"
                data-testid="model-select"
                className="rounded-md border border-neutral-300/60 p-2 text-sm dark:border-neutral-700/60 dark:bg-neutral-900/20"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {MODEL_PRESETS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="temp" className="text-sm font-medium">Temperature: {temperature.toFixed(1)}</label>
              <input
                id="temp"
                data-testid="temperature"
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Context</label>
              <div className="flex items-center gap-2">
                <input
                  id="ctx-toggle"
                  type="checkbox"
                  checked={injectContext}
                  onChange={(e) => setInjectContext(e.target.checked)}
                />
                <label htmlFor="ctx-toggle" className="text-sm">Inject from Inventory</label>
              </div>
              <button
                type="button"
                className="mt-2 w-fit rounded-md border border-neutral-300/60 px-2 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700/60 dark:hover:bg-neutral-900"
                onClick={() => setContextPreviewOpen((v) => !v)}
                aria-expanded={contextPreviewOpen}
              >
                {contextPreviewOpen ? "Hide" : "Show"} context preview
              </button>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Stream</label>
              <div className="flex items-center gap-2">
                <input
                  id="stream-toggle"
                  data-testid="stream-toggle"
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                />
                <label htmlFor="stream-toggle" className="text-sm">Stream mode</label>
              </div>
            </div>
          </div>
        </div>

        {contextPreviewOpen && (
          <div className="mt-3 rounded-md border border-dashed border-neutral-300/60 p-3 text-xs dark:border-neutral-700/60">
            <div className="mb-2 flex items-center justify-between">
              <span className="opacity-70">Inventory context ({fmt})</span>
              <span className="opacity-60">{contextText ? contextText.split("\n").length : 0} lines</span>
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap">{contextText || "<empty>"}</pre>
          </div>
        )}

        {/* Cost HUD */}
        <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="cost-hud">
          <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">Est. tokens in: {tokensInEst}</span>
          <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">${formatUsd(priceFor(model), 2).slice(1)}/1K</span>
          <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">Est. cost: {formatUsd(estCost, 4)}</span>
        </div>
      </section>

      {/* Actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          data-testid="run-left"
          onClick={() => run("left")}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
          disabled={leftLoading}
        >
          {leftLoading ? (useStreaming ? "Streaming…" : "Running…") : "Run Left"}
        </button>
        <button
          data-testid="run-right"
          onClick={() => run("right")}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          disabled={rightLoading}
        >
          {rightLoading ? (useStreaming ? "Streaming…" : "Running…") : "Run Right"}
        </button>
        <button
          data-testid="run-both"
          onClick={() => run("both")}
          className="rounded-md border border-neutral-300/60 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700/60 dark:hover:bg-neutral-900"
          disabled={leftLoading || rightLoading}
        >
          Run Both
        </button>
        {errorMsg && (
          <span role="alert" className="text-sm text-red-600">{errorMsg}</span>
        )}
      </div>

      {/* Results */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200/50 p-3 dark:border-neutral-700/50" aria-live="polite">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Result A</h2>
            {(leftResult || (leftLoading && useStreaming)) && (
              <div className="flex items-center gap-2 text-xs opacity-70" data-testid="result-left-hud">
                <span>{(leftResult?.totalTokens ?? ((leftStreamTokensIn ?? 0) + leftStreamTokensOut))} tok</span>
                <span>·</span>
                <span>{leftResult?.elapsedMs ?? leftElapsed} ms</span>
                <span>·</span>
                <span>{useStreaming ? "–" : (leftResult ? (leftResult.costUsd === null ? "–" : formatUsd(leftResult.costUsd, 4)) : "–")}</span>
              </div>
            )}
          </div>
          <pre data-testid="output-left" className="min-h-[160px] whitespace-pre-wrap text-sm">{useStreaming ? (leftLoading ? leftStreamOutput : (leftResult?.output || "")) : (leftLoading ? "…" : (leftResult?.output || ""))}</pre>
        </div>
        <div className="rounded-lg border border-neutral-200/50 p-3 dark:border-neutral-700/50" aria-live="polite">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Result B</h2>
            {(rightResult || (rightLoading && useStreaming)) && (
              <div className="flex items-center gap-2 text-xs opacity-70" data-testid="result-right-hud">
                <span>{(rightResult?.totalTokens ?? ((rightStreamTokensIn ?? 0) + rightStreamTokensOut))} tok</span>
                <span>·</span>
                <span>{rightResult?.elapsedMs ?? rightElapsed} ms</span>
                <span>·</span>
                <span>{useStreaming ? "–" : (rightResult ? (rightResult.costUsd === null ? "–" : formatUsd(rightResult.costUsd, 4)) : "–")}</span>
              </div>
            )}
          </div>
          <pre data-testid="output-right" className="min-h-[160px] whitespace-pre-wrap text-sm">{useStreaming ? (rightLoading ? rightStreamOutput : (rightResult?.output || "")) : (rightLoading ? "…" : (rightResult?.output || ""))}</pre>
        </div>
      </section>

      <footer className="mt-6 text-xs opacity-70">
        <p data-testid="what-leaves-disclosure">
          Privacy: When you run prompts locally, no prompt or context contents leave your machine. We only record lightweight metadata (model id, token counts, durations, HTTP status) to a local in-memory buffer for debugging, and print it to the console in development. Set PIGEON_TELEMETRY_DISABLED=1 to disable even local telemetry.
        </p>
      </footer>
    </main>
  );
}