# Pigeon — Security Policy

Last updated: 2025-08-23

Guiding principles
- Local-first: Your code and files remain on your device unless you explicitly choose to send them to a cloud model or service.
- Transparency: The UI clearly discloses what content (files, snippets, metadata) will leave your machine before any network transfer.
- Least privilege: Keys and permissions are scoped to the minimum required. Sensitive data is never logged.

Data handling
- Local storage: Prompt history, configuration, and cached context packages are stored in browser storage (IndexedDB/OPFS) and encrypted at rest.
- Cloud sync (Phase 2+): When enabled, synchronized artifacts (e.g., templates, history metadata) are encrypted in transit and at rest. Content is limited to what you opt in to sync.
- Filesystem: Ignore rules (.gitignore and custom) are respected to avoid accidental inclusion of sensitive files.

Model providers and keys
- Supported: OpenAI, Anthropic, Google Gemini, Mistral, Ollama, DeepSeek (configurable).
- Secret management: Provider API keys are stored securely (server-side or OS keychain when applicable) and never committed to source control. Keys are redacted from logs.

Local agent/Electron
- Scope: Enhances local filesystem features (large directory traversal, accurate tokenization, diff apply) on 127.0.0.1 only.
- Boundary: No remote network access on behalf of the user without explicit consent; configurable allowlist; hardened IPC.

Telemetry and analytics
- Default: Minimal, privacy-preserving metrics. No file contents or prompts are collected without explicit consent.
- Opt-in: Additional diagnostics can be enabled for support; data is time-bound and scrubbed of secrets.

Vulnerability disclosure
- Report security issues to security@pigeonprompt.com with details and reproduction steps.
- We acknowledge receipt within 3 business days and provide remediation timelines where possible.

Dependencies and supply chain
- Automated dependency scanning (prod and dev) with policy on critical CVEs.
- Signed releases and checksums for downloadable artifacts when applicable.