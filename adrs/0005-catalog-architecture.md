# ADR 0005 — Catalog Architecture (Phase 1)

Status: Proposed
Date: 2025-08-23

Context
Phase 1 delivers the Community Prompt Catalog MVP: searchable prompts, versions, tags, and basic curation. Requirements: fast search, clean moderation path, simple authoring. Future phases add vector search, advanced analytics, and collaboration.

Decision
- Data store: PostgreSQL (managed), leveraging text search (pg_trgm) and JSONB for flexible metadata.
- Core schema: Prompt, PromptVersion, Tag, PromptTag, User, Vote, Collection, CollectionItem.
- Search: Trigram + ranked full-text on name/desc/variables/tags. Phase 2 can add pgvector for semantic search.
- API: REST over HTTPS, with pagination, filters, sort by recency and score; ETags for caching.
- Moderation: soft-delete + status field (draft, public, flagged, removed) with audit tables.

Rationale
- Postgres gives transactional integrity, relational joins, and evolving schema via migrations.
- pg_trgm supports fast, typo-tolerant matching without heavy infra. pgvector remains optional later.
- REST keeps integration simple for web app and Chrome extension.

Consequences
- Pros: Simple, reliable, cost-effective MVP; good DX.
- Cons: No semantic search at launch; migration to vector index adds later complexity.

Operational notes
- Indices: GIN on tags, trigram on prompt name, GIN on to_tsvector(description).
- Rate limiting and abuse prevention on write endpoints.
- CDN caching for GET endpoints with Cache-Control and ETag.