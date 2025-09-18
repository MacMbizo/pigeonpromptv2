# Pigeon — Deployment Guide

Purpose: How to set up local development and deploy Pigeon safely with strong privacy defaults.
Last updated: 2025-08-23

Prerequisites
- Node.js 20+
- PNPM or NPM
- Git, Git LFS (if storing large assets)

Local development (Windows PowerShell)
1) Clone repo and install deps
   - git clone <repo>
   - cd repo
   - pnpm install  (or npm ci)
2) Environment variables (create .env.local)
   - OPENAI_API_KEY=...
   - ANTHROPIC_API_KEY=...
   - GOOGLE_API_KEY=...
   - MISTRAL_API_KEY=...
   - DEEPSEEK_API_KEY=...
   - OLLAMA_BASE_URL=http://127.0.0.1:11434
   - NEXT_PUBLIC_ANALYTICS_WRITE_KEY=...
3) Run the app
   - pnpm dev  (Next.js)
   - Visit http://localhost:3000/

Domains
- App: https://www.pigeonprompt.com
- API: https://api.pigeonprompt.com (configurable)

Local agent/Electron (in-scope)
- Start agent on 127.0.0.1:27182 to enable enhanced FS and diff apply
- Lock down to loopback; no external exposure

Production deployment
- Recommended: Vercel (Next.js App Router)
- Configure environment variables per above in project settings
- Protect secrets; do not bundle provider keys client-side unless strictly scoped
- Enable logging, error monitoring, and request tracing

Security checklist
- “What leaves the machine” disclosure enabled by default
- Local-only mode tested and documented
- Strict CORS and CSP; dependency audit; secret scanning
- Access control for team workspaces; audit logs enabled

Operations
- CI/CD: build, lint, typecheck, tests, accessibility checks
- Observability: logs, metrics, alerts; performance budgets enforced
- Backup/retention: define policies for histories and analytics