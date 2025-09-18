# Pigeon — API Reference (Planned)

Scope: Planned public/internal HTTP and streaming endpoints for the workspace, local agent, and catalog.
Last updated: 2025-08-23

Base URLs
- App: https://www.pigeonprompt.com
- API: https://api.pigeonprompt.com (configurable)
- Local agent (in-scope): http://127.0.0.1:27182

Supported model providers (via adapters)
- OpenAI, Anthropic, Google Gemini, Mistral, Ollama, DeepSeek

Authentication
- Session auth for app; bearer provider keys stored securely per user

Workspace endpoints
- POST /api/prompt/run
  - Body: { templateId?, model, variables?, contextPackage, options? }
  - Stream: SSE at /api/prompt/stream?id=RUN_ID
  - Returns: { runId }
- GET /api/templates
  - Query: { q?, page?, pageSize? }
  - Returns: { items: Template[], total }
- POST /api/templates
  - Body: TemplateCreate
  - Returns: Template
- GET /api/history
  - Query: { page?, pageSize?, templateId? }
  - Returns: { items: RunRecord[], total }

Local agent endpoints (in-scope)
- GET /agent/fs/list?root=PATH → { tree: FileNode }
- GET /agent/fs/read?path=FILE → { content, language, size }
- POST /agent/diff/apply { changes: Patch[], cwd } → { applied: boolean, summary }

Catalog endpoints (Phase 1 PRD)
- GET /api/catalog/prompts?q=&platform=&category=&sort=
- POST /api/catalog/prompts (auth) → submission
- POST /api/catalog/votes (auth) → { promptId, vote }
- GET /api/catalog/stats → usage/trending

Types (abridged)
- Template: { id, name, variables: string[], phases: Phase[], targetModels: string[] }
- RunRecord: { id, templateId, model, input, output, diffs, createdAt }
- FileNode: { name, path, type: 'file'|'dir', children?: FileNode[] }
- Patch: { file, hunks: Hunk[] }

Errors & rate limits
- JSON error envelope: { error: { code, message, details? } }
- Provider backoff and retry hints via headers; adapter-normalized error codes