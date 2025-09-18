-- Pigeon Catalog Indexes & Search

-- Trigram indexes for fuzzy search
create index if not exists idx_prompts_name_trgm on prompts using gin (name gin_trgm_ops);

-- Full-text search vector on name + description (English)
create index if not exists idx_prompts_fts on prompts using gin (
  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
);

-- Tags name unique index already exists; add trigram for partials
create index if not exists idx_tags_name_trgm on tags using gin (name gin_trgm_ops);

-- Foreign key helper indexes
create index if not exists idx_prompt_versions_prompt_id on prompt_versions(prompt_id);
create index if not exists idx_prompt_tags_prompt_id on prompt_tags(prompt_id);
create index if not exists idx_prompt_tags_tag_id on prompt_tags(tag_id);
create index if not exists idx_prompts_author_id on prompts(author_id);
create index if not exists idx_collections_owner_id on collections(owner_id);
create index if not exists idx_collection_items_collection_id on collection_items(collection_id);
create index if not exists idx_collection_items_prompt_id on collection_items(prompt_id);