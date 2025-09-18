# ADR 0003 — Local Agent Scope and Security

Status: Accepted
Date: 2025-08-23

Decision
Include a local agent/Electron helper as in-scope to provide advanced filesystem traversal, accurate tokenization, and safe diff application on localhost (127.0.0.1). No remote access by default.

Scope
- File listing/reading with ignore rules
- Token estimation and language-aware chunking
- Apply diffs/patches to local files with preview/confirm

Security
- Loopback binding only, configurable port
- No outbound network calls without explicit consent
- Hardened IPC, input validation, and sandboxing where applicable