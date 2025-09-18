# ADR 0006 — Cloud Sync Provider & Encryption Model

Status: Proposed
Date: 2025-08-23

Context
Phase 2 introduces optional cloud sync and team workspaces. We must choose a backend and an encryption strategy that preserve local-first privacy while enabling collaboration and auditability.

Options
1) Supabase (Postgres + RLS + Edge Functions)
   - Pros: SQL power, Row Level Security, realtime, storage, auth; strong OSS story.
   - Cons: Slightly more ops overhead vs Firestore; SQL migrations to manage.
2) Firebase (Firestore + Auth + Functions)
   - Pros: Great client SDKs, realtime by default, low ops.
   - Cons: No SQL; complex queries can be costly; security rules complexity; vendor lock-in.

Decision (recommended)
- Choose Supabase for cloud sync and team workspaces, leveraging Postgres, RLS, and Edge Functions.
- Encryption model: Client-side envelope encryption using WebCrypto.
  - Derive KEK from a passphrase via Argon2id (or PBKDF2 as fallback), store salt+params.
  - Wrap a random DEK (AES-256-GCM) used to encrypt workspace payloads (histories, templates).
  - Store only wrapped DEK server-side; plaintext keys never leave the client.
  - Support recovery codes and passphrase rotation.

Rationale
- Supabase’s RLS maps well to per-user/team access controls and audit needs; SQL aids analytics.
- Envelope encryption preserves zero-knowledge of content on the server while enabling key rotation.

Consequences
- Pros: Strong privacy guarantees; flexible queries; clear authz controls.
- Cons: Client key UX (recovery/rotation) must be designed carefully; server-side indexing limited on encrypted blobs.

Migration & Interop
- Provide export/import of encrypted archives; allow offline-only mode without cloud.
- If switching to Firebase later, keep an API layer abstracted to avoid vendor lock-in.