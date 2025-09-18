-- Pigeon Catalog Schema (Phase 1)
-- Requires: pgcrypto, pg_trgm extensions

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Users table maps to auth identities (Supabase: users.id == auth.uid())
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  handle text unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text,
  variables jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','public','flagged','removed')),
  score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  version integer not null,
  content text not null,
  model_targets text[] not null default '{}',
  changelog text,
  created_at timestamptz not null default now(),
  unique(prompt_id, version)
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists prompt_tags (
  prompt_id uuid not null references prompts(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (prompt_id, tag_id)
);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists collection_items (
  collection_id uuid not null references collections(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (collection_id, prompt_id)
);

create table if not exists votes (
  user_id uuid not null references users(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  direction smallint not null check (direction in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

-- Optional: minimal audit log
create table if not exists audit_log (
  id bigserial primary key,
  actor_id uuid references users(id) on delete set null,
  entity_table text not null,
  entity_id uuid,
  action text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Triggers for updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prompts_updated_at on prompts;
create trigger trg_prompts_updated_at
before update on prompts
for each row execute procedure set_updated_at();

drop trigger if exists trg_collections_updated_at on collections;
create trigger trg_collections_updated_at
before update on collections
for each row execute procedure set_updated_at();


-- Templates table for system and user templates
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null, -- null => system template
  name text not null,
  description text,
  system_prompt text not null default '',
  user_prompt_template text not null default '',
  variables jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger for templates
drop trigger if exists trg_templates_updated_at on templates;
create trigger trg_templates_updated_at
before update on templates
for each row execute procedure set_updated_at();