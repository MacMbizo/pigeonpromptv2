# PP-001: Context Workspace — Preview Panel v1

Status: Open
Owner: Engineering (Assignee TBD), Design (Assignee TBD)
Links:
- DoR + AC: tasks.md (Feature PP-001) — see repository root
- Design spec: design/preview-panel-v1.md

Summary
Deliver Preview Panel v1 enabling users to include/exclude files and choose excerpt modes (head/tail/custom) with live token/cost HUD, fully local with persistence.

Scope
- FileList (virtualized when large) with include/exclude controls
- PreviewPanel with syntax highlighting
- ExcerptControls: head/tail/custom with range UI
- TokenHUD: live aggregates via token-estimator
- Local-only persistence (localStorage) with versioning/guards

Acceptance Criteria (source of truth in tasks.md)
- Include/exclude per file with persisted state
- Excerpt modes and visual indicators
- Token HUD updates ≤ 200ms
- Accessibility: keyboard nav, ARIA labels/roles, live region for HUD
- Performance: no jank on large lists; lazy loaded preview

Out of Scope (v1)
- Execution pipeline and provider calls
- Cloud sync or multi-user sharing

Testing Plan
- Unit (Vitest): reducers/selectors, HUD aggregation and debounce, storage adapter
- E2E (Playwright): toggles affect HUD and persist; excerpt modes affect HUD; keyboard-only path; Axe pass
- A11y: Axe checks integrated into E2E

Tasks
- [ ] Implement state model and persistence layer
- [ ] FileList with include/exclude and preview activation
- [ ] PreviewPanel (lazy render + syntax highlighting)
- [ ] ExcerptControls (head/tail/custom)
- [ ] TokenHUD integration and debounce
- [ ] Accessibility pass (keyboard + ARIA + contrast)
- [ ] Unit tests for reducers/selectors/storage/HUD
- [ ] E2E spec unskip and make green
- [ ] Update tasks.md status; attach demo to PR

Risks & Mitigations
- Large workspaces: virtualize lists; lazy load content
- Token estimator perf: memoize per-file counts; delta recompute

Definition of Done
- All AC satisfied; lint/typecheck/tests green; a11y checks pass; docs updated; demo attached.