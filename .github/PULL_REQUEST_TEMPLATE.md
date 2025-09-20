<!--
Title must follow Conventional Commits, e.g., feat(studio): add model preset dropdown
See RULES.md for complete standards.
-->

## Linked Issue(s)
- Closes #<issue-id>
- Related: #<issue-id>

## Summary
- What problem does this PR solve?
- Why is this the right solution now?

## Scope & Implementation
- High-level approach and design decisions
- Notable trade-offs or alternatives considered
- Affected areas (pages, modules, APIs)

## Screenshots / Video (UI changes)
- Before / After or short clip demonstrating the change

## Test Plan
- Commands executed locally:
  - pnpm run lint
  - pnpm run typecheck (if available)
  - pnpm run test:unit
  - npx playwright install (first time only), then pnpm run test:e2e:smoke:ci (for UI/flows)
- Manual verification notes (browsers, viewport sizes)

## Risks & Rollout
- Known risks or edge cases
- Backout plan (revert strategy, feature flag)

## ADR / Docs
- ADR updates required? If diverging from an ADR, explain why.
- Docs updated (tasks.md, feature docs) as needed

---

PR Quality Checklist (from RULES.md)
- [ ] Acceptance criteria met and demonstrated
- [ ] Unit tests updated/added and passing
- [ ] E2E tests updated/added (if UI/flow changed)
- [ ] Lint/typecheck clean
- [ ] Docs updated (tasks.md or feature docs)
- [ ] No secrets; performance considerations addressed
- [ ] Accessibility implications considered (labels, keyboard, contrast)

---

CI Status
- [ ] CI is green (build, lint, typecheck, unit, smoke E2E)

Notes
- Source of truth for standards: RULES.md (keep this checklist in sync)