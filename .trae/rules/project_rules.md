# Pigeon Engineering Rules (Authoritative Project Standards)

Purpose: This document codifies how we build, test, review, release, and assure quality for Pigeon. It is a living, enforceable standard. All contributors must follow it.

Last updated: 2025-09-03

---

## 1) Development Workflow Standards

- Branching model
  - Trunk-based with short-lived feature branches.
  - Naming: feature/<scope>-<short-desc>, fix/<scope>-<short-desc>, chore/<scope>-<short-desc>.
  - Keep branches small and focused; aim for < 300 LOC diffs per PR when feasible.

- Issue-first development
  - Every change maps to a tracked issue with acceptance criteria.
  - Link issues in PR descriptions; use checklists for acceptance criteria.

- Commit conventions (Conventional Commits)
  - Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
  - Format: <type>(<scope>): <summary>. Examples: `feat(studio): add model preset dropdown`.

- Local environment
  - Node LTS. Install deps once: `npm ci`.
  - Core scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck` (if applicable), `npm run test`, `npm run test:unit`, `npm run test:watch`.

- Definition of Ready (DoR)
  - Problem statement, acceptance criteria, success metric, testing approach identified (unit/E2E), and any data/fixtures defined.

- Definition of Done (DoD)
  - All acceptance criteria met; code reviewed and approved; unit tests added/updated and passing; E2E updated where relevant; no TODO/FIXME left in changed code; documentation updated (tasks.md or relevant docs); CI green.

---

## 2) Mandatory Testing Protocols

- General rule: No code merges without tests. Follow “red → green → refactor”.
- Immediate feature testing gate
  - After implementing a feature slice, run unit tests and—if user-visible—perform a targeted E2E smoke locally before picking up the next task.
  - For UI features, add/adjust Playwright tests during the same PR.

- Unit tests (Vitest)
  - Scope: pure functions, utilities, and component logic that can be tested in isolation.
  - Location: `tests/unit/**`. Name with `.test.ts`.
  - Coverage targets (minimum): lines 70%, branches 60% (raise over time). Use V8 coverage.
  - Commands: `npm run test:unit` (CI uses `npm run test`).

- End-to-end (Playwright)
  - Scope: critical user flows (Studio editing, autosave, diff controls, model presets, token insights, smoke/API behavior).
  - Location: `tests/e2e/**`.
  - Local setup: run once per machine `npx playwright install`.
  - Commands: `npx playwright test` (or project script if added). Keep specs resilient (data-testids, proper waits, avoid flaky timing).

- Linting & Types
  - Lint: `npm run lint` must pass. Keep zero warnings for changed code.
  - Types: `npm run typecheck` (if configured) must pass with strictness preserved.

- Test data and fixtures
  - Prefer deterministic fixtures; avoid real network calls in unit tests.
  - For E2E, seed stable data or mock providers behind a test flag.

---

## 3) Required Reference Materials

Consult these before design or implementation changes:
- Product & planning: `tasks.md`, `PRD.md`, `Features.md`, `ENHANCED_FEATURES.md`.
- Design & UX: `design.md`, `Prompt Feature Summary.md`.
- Architecture decisions: `adrs/*.md` (e.g., adapters, storage/history, collaboration protocol).
- Security & privacy: `THREAT_MODEL.md`, `SECURITY.md`.
- API & deployment: `API_REFERENCE.md`, `DEPLOYMENT.md`.
- Contribution & CI: `CONTRIBUTING.md`, `.github/workflows/*.yml`.

Changes that contradict these must include ADR updates or PR notes that justify divergence.

---

## 4) Version Control Guidelines

- Reviews & PR hygiene
  - Small, focused PRs with clear descriptions, linked issues, and test evidence (screenshots, recordings, or test output).
  - Require at least one maintainer approval for risky/architectural changes.

- Secrets & data
  - Never commit secrets or real credentials. Use `.env` locally; keep `.env.example` updated when variables change.
  - Sanitize test artifacts and logs.

- History & releases
  - Use Conventional Commits to generate changelogs.
  - Tag releases with semantic versions (vX.Y.Z). Draft release notes referencing user‑visible changes and risks.

- Branch protection (recommended)
  - Require: build, lint, typecheck, unit tests, and smoke E2E to pass on PR.
  - Disallow force pushes to main; require linear history or squash merges.

---

## 5) Quality Assurance Processes

- PR Quality Checklist (attach to PR description)
  - [ ] Acceptance criteria met and demonstrated
  - [ ] Unit tests updated/added and passing
  - [ ] E2E tests updated/added (if UI/flow changed)
  - [ ] Lint/typecheck clean
  - [ ] Docs updated (tasks.md or feature docs)
  - [ ] No secrets; performance considerations addressed
  - [ ] Accessibility implications considered (labels, keyboard, contrast)

- Accessibility & Performance (incremental gates)
  - New UI must be keyboard navigable; include aria-labels/roles where sensible.
  - Track perf budgets for key interactions (Studio load, diff render). Avoid regressions.

- Security & Privacy
  - Follow least-privilege for keys; never log secrets.
  - Implement "what leaves the machine" disclosures for networked actions.

- CI/CD Expectations
  - CI runs: install, build, lint, typecheck, unit tests, and (as available) E2E smoke.
  - Fail fast policy: CI must fail on any of the above; fix or revert quickly.

---

## 6) Release & Change Management

- Pre-release checklist
  - All critical flows covered by E2E; unit coverage thresholds met.
  - Known issues documented with severity and workarounds.
  - SECURITY.md and THREAT_MODEL.md reviewed if scope touches data/keys.

- Post-release
  - Monitor errors and logs; prepare a follow-up hardening sprint if needed.
  - Update CHANGELOG.md and milestone status in `tasks.md`.

---

## 7) Ownership & Governance

- Ownership is documented via codeowners (if enabled) or ADRs. High-risk changes require owner consent.
- Weekly milestone review keeps `tasks.md` current and drives priorities.

---

## Quick Commands Reference

- Install deps: `npm ci`
- Dev: `npm run dev`
- Unit tests: `npm run test:unit`
- All tests: `npm run test`
- E2E (first time): `npx playwright install`; run: `npx playwright test`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck` (if present)
- Build: `npm run build`
- Preview: `npm run preview`
- Deploy: `npm run deploy`