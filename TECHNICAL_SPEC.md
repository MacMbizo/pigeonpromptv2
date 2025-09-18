# Pigeon — Technical Specification

Purpose: Define architecture and technical contracts for the core platform, enabling consistent, secure, and scalable implementation across modules.
Last updated: 2025-08-23

Architecture overview
- App: Next.js 14 (App Router) with Tailwind CSS and shadcn/ui
- Local-first: All file context remains local unless explicitly sent; local agent/Electron is in-scope for enhanced FS ops and diff apply
- Model-agnostic: Provider adapters normalize prompt formatting, auth, streaming, and error handling
- Data: Local (IndexedDB/OPFS) for histories/config; optional cloud (e.g., Supabase/Firebase) for teams/collab
- Domains: App at https://www.pigeonprompt.com; API at https://api.pigeonprompt.com (configurable)

Core modules
- File Explorer: directory connect, recursive traversal, ignore rules, token estimates
- Preview Panel: syntax-highlighted read-only display, include/exclude, excerpt modes
- Context Builder: assemble files/snippets/notes, auto file-tree preamble, export XML/Text
- Code Maps: language parsers → IR → Mermaid diagrams (JS/TS, Python; extensible)
- Templates: variable interpolation (e.g., {{file_tree}}), multi-phase chains, CRUD and version tags
- Model Adapters: OpenAI/Anthropic/Gemini/Mistral/Ollama/DeepSeek via a unified interface
- Execution Pipeline: prompt assembly → adapter → streamed output → normalization
- Diff Engine: normalize code suggestions → side-by-side/inline views → selective apply
- History: encrypted local store, runs with inputs/outputs/metadata; replay/fork/compare

Security & privacy
- Explicit disclosure of outbound content; local-only mode with offline models
- Key handling: never log secrets; per-provider key vault; secure storage
- Sandboxed FS: respect ignore rules; workerize heavy parsing

Performance & accessibility
- Virtualized trees/previews for large repos; incremental tokenization
- Web workers for parsing/token counts; debounced updates; streamed rendering
- Keyboard-first navigation; ARIA roles; reduced motion support

Open decisions
- Realtime/collab stack specifics (e.g., Yjs server/persistence)
- Cloud backend vendor and encryption scheme for team workspaces
- Evaluation harness and golden datasets for prompt testing