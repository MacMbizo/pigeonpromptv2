# PR: test(e2e): add Context Preview recording spec and video-enabled config

Linked Issue: PP-001

Summary
- Adds a one-off Playwright spec that records a short Context Preview micro‑demo to embed in the PR (and potentially docs). 
- Ensures robust selectors (role + data-testid) and enables video capture both per-spec and via a plain Playwright config for ad‑hoc runs.
- Uses the main Playwright config’s baseURL/webServer for stability; for local runs we override APP_URL=4100 to avoid conflicts.

Scope of Changes
- tests/e2e/record-context-preview.spec.ts: New targeted recording spec showcasing the Context Preview panel, heading, toggles, and live preview inputs.
- playwright.plain.config.ts: Video-enabled minimal config suitable for one-off local recordings.

How to run locally
Option A (recommended, uses main config & dev server):
- APP_URL=http://localhost:4100 npx playwright test tests/e2e/record-context-preview.spec.ts

Option B (explicit plain config):
- npx playwright test tests/e2e/record-context-preview.spec.ts --config=playwright.plain.config.ts

Evidence
- Lint: pnpm run lint → PASS
- Unit tests: pnpm run test:unit → PASS (coverage produced; thresholds maintained)
- Targeted E2E (recording spec): PASS
  ```
  1 passed (8.5s)
  [WebServer] [DEV FALLBACK] GET /api/prompts/.../versions prompt not found; returning mock versions
  ```
- Video artifact (for GIF conversion/attachment):
  C:\pigeon\test-results\record-context-preview-Rec-d4879-d-basic-toggles-interaction\video.webm

Notes on GIF conversion
- ffmpeg not available in local env. If desired, convert on a machine with ffmpeg installed:
  - ffmpeg -i video.webm -vf "fps=12,scale=900:-1:flags=lanczos" -loop 0 preview.gif

Risk / Impact
- Low. Test-only changes plus a standalone Playwright config. No runtime code paths altered.

Rollback Plan
- Revert this commit.

PR Quality Checklist
- [x] Acceptance criteria met and demonstrated (recorded interaction + passing spec)
- [x] Unit tests passing
- [x] E2E updated/added and passing
- [x] Lint clean
- [x] No secrets committed
- [x] Accessibility considered (heading role + labels asserted)

Changelog
- test(e2e): add context preview recording spec and video-enabled config (Refs: PP-001)