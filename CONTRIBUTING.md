# Contributing to Pigeon

Thank you for helping build a best-in-class platform for prompt and context engineering!

Getting started
- Requirements: Node 20+, PNPM/NPM, Git
- Install: pnpm install (or npm ci)
- Run: pnpm dev → http://localhost:3000

Branching and commits
- Branches: feature/<scope>, fix/<scope>, docs/<scope>, chore/<scope>
- Conventional Commits: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- PR size: favor small, focused PRs with a clear checklist (below)

Code standards
- TypeScript everywhere; ESLint + Prettier enforced
- UI: shadcn/ui + Tailwind, follow design tokens and components in design.md
- Accessibility: keyboard navigation, ARIA roles, color contrast, reduced motion
- Tests: unit (vitest/jest), E2E (Playwright), a11y checks (axe), visual diffs (optional)

PR checklist
- [ ] Lint/typecheck pass
- [ ] Unit tests updated/added; coverage unaffected
- [ ] E2E happy path for new flows (if applicable)
- [ ] A11y verification for interactive components
- [ ] Docs updated (API/spec/depoyment) if behavior changed
- [ ] Screenshots or short Loom for UX-affecting changes

Design contributions
- Use existing tokens/components; propose new tokens/components via RFC/issue
- Include rationale, states, and responsiveness; attach Figma if available

Security and keys
- Never commit secrets. Use .env.local and secret managers. See SECURITY.md

Issue triage
- Labels: bug, enhancement, design, docs, security, good-first-issue
- Include repro steps, expected/actual, logs, and environment

Release process
- Main is protected. Squash merge after approval and green CI. Update CHANGELOG.md