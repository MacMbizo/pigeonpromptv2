# Pigeon — Project Plan and Task Breakdown (tasks.md)

Purpose: This document defines the workstreams, milestones, and deliverables required to ship Pigeon as a best‑in‑class platform for prompt and context engineering. It is grounded in: design.md, Features.md, Prompt Feature Summary.md, ENHANCED_FEATURES.md, and PRD.md.

Last updated: 2025-09-03

Milestones and success criteria
- M1 — Workspace Developer Preview
  - Deliver: Local folder connect, file tree with ignore support, preview panel, token budget HUD, context builder, templates CRUD, code maps (JS/TS/Python), copy-as-XML/Text
  - Criteria: Can assemble and preview a prompt with selected files/snippets and run against at least one model adapter (streamed output)
- M2 — Workspace GA
  - Deliver: Diff viewer with selective apply, prompt history (replay/fork/compare), “what leaves the machine” disclosure, local-only mode, basic analytics (local)
  - Criteria: 95% happy path reliability across repos up to large monorepos; accessibility pass; performance budgets met
- M3 — Chrome Extension Alpha (Phase 2)
  - Deliver: In‑flow one‑click copy, recent prompts, site-aware insertion for major AI UIs
  - Criteria: Works on latest Chrome/Edge, aligns with privacy model
- M4 — Community Catalog MVP (PRD Phase 1)
  - Deliver: Browse, search/filter, categories/platform tags, copy history, submission with OAuth, voting/ratings, moderation flow, trust signals
  - Criteria: All success metrics instrumentation in place
- M5 — Team Collaboration Beta (Phase 2)
  - Deliver: Cloud sync workspaces, sharing, real-time co-editing, audit logs
  - Criteria: Multi-user concurrency with conflict resolution and RBAC
- M6 — AI‑Enhanced Features Beta (Phase 3)
  - Deliver: Prompt learning, variant generation, improvement suggestions
  - Criteria: Offline/online model parity via adapters; evaluation harness

Workstreams and key tasks
A. Context Engineering Workspace
- File system access: directory connect, recursive tree, .gitignore/custom ignore, token estimates [Done/Planned]
- Preview panel: syntax highlighting, include/exclude toggles, head/tail/custom excerpts [Planned]
- Context builder: assemble files/snippets/notes, auto file-tree preamble, export XML/Text [Done/Planned]
- Code maps: Mermaid diagrams for JS/TS/Python; extensible parser pipeline [Done/Planned]
- Templates: library with variables and multi-phase flows; CRUD and versioning [Done/Planned]
- Model adapters: provider-agnostic interface; Dev adapter scaffold in place, provider routing planned; OpenAI/Anthropic/Gemini/Mistral/Ollama initial set [Planned]
- Execution pipeline: /api/prompt/run and /api/prompt/stream wired to LLM service (dev adapter); streaming UI present; error/fallback handling, rate-limit backoff [Planned]
- Output handling: normalize suggestions, side-by-side/inline diff, selective apply [Planned]
- History: store inputs/metadata/output locally (encrypted), replay/fork/compare [Planned]
- Privacy: “what leaves” disclosure, local-only mode [Planned]

B. Collaboration & Analytics (Phase 2)
- Realtime co-editing (OT/CRDT), presence, comments
- Cloud sync (e.g., Supabase/Firebase), encrypted at rest, audit logs
- Workspace sharing, RBAC, orgs/teams
- Usage analytics dashboards (privacy-preserving)

C. Chrome Extension (Phase 2)
- Context-aware prompt suggestions; one-click copy into target UIs
- Cross-site content script architecture; options page; premium features

D. Community Catalog (PRD)
- Content model: prompts, categories, platforms, ratings, examples
- Discovery: search/filter, trending/featured, copy history
- Submissions: OAuth, guided form, moderation workflows
- Trust: verification badges, success metrics, timestamps, comments

E. Design System & UX QA
- Theming, dark mode parity, keyboard navigation, screen reader support
- Component library parity across pages; performance budgets; motion guidelines

F. Security & Compliance
- Secret management, provider keys, least-privilege
- Local-only guarantees and disclosures; data retention policy

G. DevOps & Deployment
- Environments (dev/staging/prod), CI/CD, error monitoring, logging
- Edge cache & SSR strategy (Next.js), feature flags

Key deliverables by milestone
- Detailed acceptance criteria for each feature
- Demo checklist per milestone
- Test plans (accessibility, performance, cross-browser)
- Rollout playbook and metrics dashboard

Dependencies & risks
- Browser FS permissions and sandbox limits → optional helper app/agent
- Provider rate limits and API policy variance → robust adapters/backoff
- Large repo performance → lazy traversal, virtualization, workerization

Operating cadence
 - Weekly milestone review; Kanban with clear Definition of Done; changelog discipline

Branch protection — Required status checks (recommended)
- Ensure the following CI jobs are required on pull requests before merge:
  - lint
  - typecheck
  - unit_tests
  - e2e_smoke
  - accessibility (Pa11y/Axe against key routes)
  See .github/workflows/ci.yml for job names and configuration.

 ---

 Findings Summary
- Architecture & stack:
  - Next.js (App Router) with TypeScript and Tailwind CSS; Studio workspace implemented under src/app/studio/[id]/page.tsx with diff controls, autosave, model target chips, and token/cost insights using shared utilities.
  - Utilities: src/lib/token-estimator.ts provides estimateTokens and estimateCost used in Studio; validated by unit tests.
  - Backend scaffolding: API endpoints for prompts/versions referenced by Studio (loading via /api/prompts/[id] and /api/prompts/[id]/versions).
- Testing & tooling:
  - Unit testing: Vitest configured in vitest.config.ts with scripts test, test:unit, test:watch; unit tests exist at tests/unit/token-estimator.test.ts and are passing locally.
  - E2E: Playwright tests exist (tests/e2e/*.spec.ts) covering Studio autosave, chips entry, diff toggles, hotkeys, and smoke/API ETag checks; browsers not yet installed on this machine (requires npx playwright install).
- UI features validated:
  - Model preset dropdown present; cost per 1K tokens auto-fills; ability to add preset as a model target.
  - Token insights present in Studio and driven by the estimator utility.
- Gaps vs M1 scope:
  - Preview panel interactions, context builder end-to-end flow, template CRUD UI, code maps pipeline, execution pipeline (streaming run) and initial model adapters are not yet fully implemented/wired.

Current Status
- M1 — Workspace Developer Preview (overall): early implementation with working Studio editor foundations; estimate 30–35% of M1 scope completed.
- Completed/Working
  - Model preset dropdown + token/cost estimation integrated in Studio.
  - Autosave and draft recovery for Studio content (localStorage).
  - Diff display controls: side-by-side, word-level, hide unchanged, context radius.
  - Unit test suite installed and green for estimator utility.
  - Dev server runs locally without runtime errors.
- In progress / Pending
  - E2E environment: Playwright browsers need installation; tests to be run regularly in CI and locally.
  - Context Workspace: preview panel toggles, context builder assembly/export, templates CRUD wiring, code maps rendering pipeline.
  - Model adapters and execution pipeline: minimum adapter (e.g., OpenAI) and streamed output panel; error/fallback handling.
  - Privacy/Disclosure: “what leaves the machine” UI and local-only mode switch.
  - History: local encrypted log of runs with replay/fork/compare.
- Risks/Blockers
  - Browser FS constraints for large repos; likely need workerization and virtualized file tree.
  - Provider rate limits; need backoff/retry and adapter-level error normalization.
  - E2E reliability pending until Playwright setup and CI integration are complete.

Next Steps (Prioritized)
1) Test infrastructure (Immediate)
   - Install Playwright browsers locally and in CI; run tests/e2e to baseline green.
   - Add E2E for model preset dropdown and token insights regression.
   - Wire coverage reporting for unit tests (V8) and surface badge in CI.
2) Context Workspace Foundations (High)
   - Implement Preview Panel with include/exclude toggles and excerpt modes (head/tail/custom).
   - Build Context Builder to assemble files/snippets/notes with export to XML/Text; include token budget HUD.
3) Templates Library (High)
   - CRUD UI with versioning and variables; wire to local storage or lightweight DB as interim.
4) Code Maps (Medium)
   - Parser pipeline for JS/TS/Python → Mermaid diagrams; lazy generation and caching.
5) Execution Pipeline + Model Adapters (High)
   - Implement provider-agnostic adapter interface; deliver first adapter (OpenAI) and streamed output panel.
   - Add error/fallback handling, rate-limit backoff.
6) Output Handling & History (Medium)
   - Normalize suggestions; side-by-side/inline diff integration; selective apply.
   - Local encrypted history with replay/fork/compare.
7) Privacy & Disclosures (Medium)
   - "What leaves the machine" disclosure UI; local-only mode toggle.
8) DevEx & QA (Ongoing)
   - Accessibility pass for key flows; performance budgets; keyboard nav.
   - Strengthen CI (lint, typecheck, unit, e2e) and add release checklists.
9) Telemetry & Pricing (Medium)
   - Adapter pricing integration (export getPricing; compute cost in run route from adapter values)
   - Telemetry test coverage (buffer cap, enable/disable gating, console toggle)
   - CI telemetry visibility (dev-only buffer endpoint; reporter/globalTeardown to dump artifact on failures)
   - Privacy/UI disclosure (playground disclosure; env flag to hard-disable telemetry)
   - Optional: Stream metrics HUD wiring (elapsedMs/tokens for streamed runs)


Notes
- Reference: tasks here align with tasks.md milestones and the broader PRD/design docs; see RULES.md for engineering workflow, testing gates, and QA requirements.

---

## Feature PP-001 — Context Workspace: Preview Panel v1 (DoR + AC)

Tracking: issues/PP-001-preview-panel-v1.md

Problem statement
- Users need to visually curate which local files (and which excerpts) are included in an LLM run, with immediate token/cost feedback, before any execution pipeline is wired.

Definition of Ready (DoR)
- [x] User stories finalized
  - As a user, I can browse my connected workspace, preview a file, and toggle it included/excluded for my next run.
  - I can choose an excerpt mode per file: head, tail, or custom range, and see token/cost update live.
  - My selections persist locally across reloads and can be cleared quickly.
  - The UI is keyboard-navigable and screen‑reader friendly.
- [x] Acceptance Criteria enumerated (see below)
- [x] Testing approach identified (unit, E2E, a11y); initial E2E spec skeleton prepared and skipped by default
- [x] E2E fixtures defined (tests/e2e/fixtures/workspace/*)
- [x] Microcopy defaults confirmed (labels/tooltips for include, excerpt modes, and HUD)
- [x] Feature flag/enablement strategy defined (env: E2E_ENABLE_CONTEXT_PREVIEW for tests; UI can ship behind internal flag if needed)

Acceptance Criteria (functional)
1) File list + include/exclude
   - Each file row exposes: checkbox (include/exclude), click-to-preview, quick access to excerpt modes.
   - Selection state persists in localStorage and restores on reload (resilient to parse failures).
2) Preview panel rendering
   - Syntax-highlighted content for selected file.
   - Excerpt modes:
     - Head: first N lines/characters (configurable; default sensible).
     - Tail: last N lines/characters.
     - Custom: user-defined range with a clear visual indicator of the selected range.
   - Visual chips/badges indicate included/excluded and current excerpt mode per file.
3) Token budget HUD
   - Updates within 200ms after selection or range changes.
   - Displays total tokens and estimated cost using existing estimator utilities.
4) Performance & UX
   - File list virtualized beyond ~500 items.
   - Lazy-load preview content; avoid blocking the main thread on large files.
   - No network required for v1 usage.
5) Accessibility
   - Keyboard support for all controls (tab/shift+tab, space/enter, arrow keys for range controls).
   - ARIA roles/labels present; live region for HUD updates.
   - Meets WCAG AA contrast for all new UI.

Non‑functional AC
- Interactions generally <100ms perceived; HUD update <200ms.
- Lint/typecheck clean; unit + E2E added for this feature slice.
- No secrets/PII stored; local-only persistence; no telemetry by default.

Testing plan
- Unit (Vitest): reducers/selectors for include/exclude & excerpt ranges; HUD aggregation + debounce; local storage adapter.
- E2E (Playwright): include/exclude toggles change HUD and persist across reloads; switching excerpt modes affects HUD; keyboard-only path; Axe/Pa11y pass on route.
- Accessibility: Axe in E2E; ensure live region and labels.

Timeline (est.): 5 business days
- Day 1–2: FileList + PreviewPanel scaffolding, state/persistence, highlighting.
- Day 3: ExcerptControls + TokenHUD with debounced estimator; perf tuning.
- Day 4: Unit tests + E2E smoke + a11y pass.
- Day 5: Polish, QA, docs, PR.

Owners
- Eng: Assigned
- Design: Assigned

Definition of Done (DoD)
- All AC met; unit + E2E green; Axe checks pass.
- Lint/typecheck clean; no TODO/FIXME in changed code.
- tasks.md updated; tracking issue reflects status.
- Demo artifact attached to PR.
- Accessibility pass for key flows; performance budgets; keyboard nav.
- Strengthen CI (lint, typecheck, unit, e2e) and add release checklists.
- Telemetry & Pricing (Medium)
   - Adapter pricing integration (export getPricing; compute cost in run route from adapter values)
   - Telemetry test coverage (buffer cap, enable/disable gating, console toggle)
   - CI telemetry visibility (dev-only buffer endpoint; reporter/globalTeardown to dump artifact on failures)
   - Privacy/UI disclosure (playground disclosure; env flag to hard-disable telemetry)
   - Optional: Stream metrics HUD wiring (elapsedMs/tokens for streamed runs)


Notes
- Reference: tasks here align with tasks.md milestones and the broader PRD/design docs; see RULES.md for engineering workflow, testing gates, and QA requirements.

---

Autosave Debugging (short note)
- Purpose: Enable verbose, client-safe logs for the autosave hook to triage debounce, persistence, and status transitions without affecting production behavior.
- Enable locally:
  - Add to .env.local: NEXT_PUBLIC_DEBUG_AUTOSAVE=1 (then restart dev server)
  - Or per session:
    - Windows PowerShell: $env:NEXT_PUBLIC_DEBUG_AUTOSAVE="1"; npm run dev
    - macOS/Linux: NEXT_PUBLIC_DEBUG_AUTOSAVE=1 npm run dev
- What it logs: status transitions (saving/saved/idle), debounced writes, storage cleared on clean state, manual-save window, and timer cleanup. No draft content is logged; only keys and timestamps. Runs client-side only and never logs secrets.
- Where to see: Browser DevTools console; logs are prefixed with [autosave].
- CI guidance:
  - Keep disabled by default in CI.
  - To triage a flaky autosave E2E test, temporarily enable at the workflow job/step level (e.g., env: NEXT_PUBLIC_DEBUG_AUTOSAVE: "1"). Expect noisier logs; revert after triage.
- E2E stability tip: Prefer deterministic waits keyed to UI state over time-based sleeps. Wait for:
  - data-testid="autosave-live-region" to include "Saved" (aria-live polite)
  - data-testid="autosave-badge" to appear with "Saved" and then disappear as appropriate