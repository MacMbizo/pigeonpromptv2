# ADR 0002 — Storage for History and Config

Status: Accepted
Date: 2025-08-23

Decision
Use browser storage (IndexedDB/OPFS) for local encrypted storage of prompt history, configuration, and cached context packages. Introduce optional cloud sync in Phase 2 using a managed backend (Supabase/Firebase) with per-user encryption and audit logs.

Rationale
- Local-first privacy by default
- Good performance and offline capability
- Cloud sync gated by explicit opt-in and role-based access

Consequences
- Need a portable encryption scheme and migration strategy
- Added complexity for conflict resolution when sync is enabled