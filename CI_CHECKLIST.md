# CI Checklist

Pipelines
- Lint & Typecheck: ESLint, TypeScript strict mode
- Unit Tests: vitest/jest with coverage thresholds (lines ≥ 90%)
- E2E Tests: Playwright smoke suite on key flows
- Accessibility: axe checks for changed pages/components
- Bundle Size: enforce budgets with size-limit / webpack-bundle-analyzer
- Performance Budgets: CI runs Lighthouse against key routes (LCP ≤ 2.5s on cold cache)
- Security: dependency audit (npm audit / Snyk), secret scanning, license checks

Gates (must pass to merge)
- No lint/type errors
- Tests green with coverage thresholds
- a11y checks pass (no critical issues)
- Bundle size within budgets
- Lighthouse meets performance targets
- No high/critical CVEs in production deps

Artifacts
- Test reports, coverage, Playwright traces/screenshots on failure, Lighthouse JSON

Branch protections
- Required reviews: 1+ core maintainer for risky changes (security, infra)
- Status checks required (job names):
  - lint
  - typecheck
  - unit_tests
  - e2e_smoke
  - accessibility

Release
- Tag and update CHANGELOG.md automatically on main merges with release labels