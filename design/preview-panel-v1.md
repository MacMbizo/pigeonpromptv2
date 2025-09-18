# Preview Panel v1 — Wireframe and Component API (PP-001)

Purpose
Provide a clear interaction model and component contract for the Context Workspace Preview Panel v1 so engineering can build quickly with confidence and tests can target stable testids.

IA & Layout (wireframe in words)
- Left: FileList (virtualized). Each row shows filename, path hint, include checkbox, and a quick Excerpt mode selector (Head/Tail/Custom).
- Right: PreviewPanel. Top bar shows current file path, inclusion state chip, and ExcerptControls. Below is a syntax-highlighted preview limited to current excerpt.
- Footer/right rail: TokenHUD summarizing total selected tokens and estimated cost; per-file tokens shown on hover in FileList rows.

Primary interactions
- Toggle include/exclude from row checkbox or header chip.
- Change excerpt mode (Head/Tail/Custom). Custom exposes a range control (inputs + draggable range indicator over a mini map).
- HUD updates in near-real-time on changes; announce via aria-live="polite".

Key microcopy (initial)
- Include checkbox label: "Include in context"
- Excerpt label: "Excerpt"
- Custom range inputs: "Start", "End"
- HUD: "Tokens:" and "Est. cost:"

Data-testids (stable selectors)
- context-file-list
- context-file-row (each row)
- include-toggle
- excerpt-mode-select
- excerpt-start
- excerpt-end
- preview-panel
- token-hud

Component API (TypeScript signatures)
Note: This is a design contract; actual props may extend slightly during implementation.

```ts
// State models
export type ExcerptMode = 'head' | 'tail' | 'custom';

export interface SelectedContextItem {
  path: string;
  included: boolean;
  excerptMode: ExcerptMode;
  range?: { start: number; end: number }; // inclusive character or line indexes (impl chooses)
}

export interface ContextState {
  items: Record<string, SelectedContextItem>; // keyed by path
  order: string[]; // display order of paths
}

// Components
export interface FileListProps {
  files: { path: string; size: number }[];
  state: ContextState;
  onToggleInclude: (path: string, included: boolean) => void;
  onSelectFile: (path: string) => void;
  onChangeExcerptMode: (path: string, mode: ExcerptMode) => void;
  onChangeRange: (path: string, range: { start: number; end: number }) => void;
  virtualizeThreshold?: number; // default ~500
  'data-testid'?: string; // context-file-list
}

export interface PreviewPanelProps {
  path?: string;
  content?: string; // provided or lazy-loaded
  item?: SelectedContextItem;
  onToggleInclude?: (included: boolean) => void;
  onChangeExcerptMode?: (mode: ExcerptMode) => void;
  onChangeRange?: (range: { start: number; end: number }) => void;
  'data-testid'?: string; // preview-panel
}

export interface ExcerptControlsProps {
  mode: ExcerptMode;
  range?: { start: number; end: number };
  onChangeMode: (mode: ExcerptMode) => void;
  onChangeRange: (range: { start: number; end: number }) => void;
}

export interface TokenHUDProps {
  totalTokens: number;
  estimatedCost: number; // currency unit matches estimator
  perFile?: Record<string, number>;
  'aria-live'?: 'polite' | 'assertive';
  'data-testid'?: string; // token-hud
}
```

Performance & Accessibility notes
- Debounce token recompute (~150ms) and memoize per file by (path, excerpt hash).
- Virtualize FileList when > ~500 items; lazy load preview content.
- Keyboard: tab through rows; space toggles include; arrow keys adjust range when focused.
- A11y: ensure roles/labels; token HUD updates announced via aria-live.

Open questions to validate during build
- Excerpt range unit: lines vs characters. Proposal: lines for v1 (more human-friendly), characters for internal computations if needed.
- Default N for head/tail: propose 200 lines (configurable via env for testing).