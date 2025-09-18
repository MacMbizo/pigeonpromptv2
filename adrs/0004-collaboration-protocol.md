# ADR 0004 — Collaboration Protocol

Status: Proposed
Date: 2025-08-23

Decision
Adopt a CRDT-based approach (e.g., Yjs) for real-time multi-user editing and presence in Phase 2, due to superior offline/merge capabilities versus OT.

Rationale
- Resilient to intermittent connectivity
- Natural conflict-free merges across replicas
- Mature ecosystem and awareness of performance trade-offs

Consequences
- Requires awareness of CRDT payload sizes and GC strategies
- Server component for awareness/presence and persistence (e.g., y-websocket)