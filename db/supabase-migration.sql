-- Pigeon Supabase Migration (schema + indexes + policies)
begin;

-- schema.sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

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

create table if not exists audit_log (
  id bigserial primary key,
  actor_id uuid references users(id) on delete set null,
  entity_table text not null,
  entity_id uuid,
  action text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

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

-- indexes.sql
create index if not exists idx_prompts_name_trgm on prompts using gin (name gin_trgm_ops);
create index if not exists idx_prompts_fts on prompts using gin (
  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
);
create index if not exists idx_tags_name_trgm on tags using gin (name gin_trgm_ops);
create index if not exists idx_prompt_versions_prompt_id on prompt_versions(prompt_id);
create index if not exists idx_prompt_tags_prompt_id on prompt_tags(prompt_id);
create index if not exists idx_prompt_tags_tag_id on prompt_tags(tag_id);
create index if not exists idx_prompts_author_id on prompts(author_id);
create index if not exists idx_collections_owner_id on collections(owner_id);
create index if not exists idx_collection_items_collection_id on collection_items(collection_id);
create index if not exists idx_collection_items_prompt_id on collection_items(prompt_id);

-- policies.sql
alter table users enable row level security;
alter table prompts enable row level security;
alter table prompt_versions enable row level security;
alter table tags enable row level security;
alter table prompt_tags enable row level security;
alter table collections enable row level security;
alter table collection_items enable row level security;
alter table votes enable row level security;

create policy "users_self_select" on users for select using (id = auth.uid());
create policy "users_self_upsert" on users for all using (id = auth.uid()) with check (id = auth.uid());

create policy "prompts_public_read" on prompts for select using (status = 'public');
create policy "prompts_author_read" on prompts for select using (author_id = auth.uid());
create policy "prompts_author_insert" on prompts for insert with check (author_id = auth.uid());
create policy "prompts_author_update" on prompts for update using (author_id = auth.uid());

create policy "prompt_versions_read" on prompt_versions for select using (
  exists (select 1 from prompts p where p.id = prompt_versions.prompt_id and (p.status = 'public' or p.author_id = auth.uid()))
);
create policy "prompt_versions_insert" on prompt_versions for insert with check (
  exists (select 1 from prompts p where p.id = prompt_versions.prompt_id and p.author_id = auth.uid())
);

create policy "tags_public_read" on tags for select using (true);

create policy "prompt_tags_author_write" on prompt_tags for all using (
  exists (select 1 from prompts p where p.id = prompt_tags.prompt_id and p.author_id = auth.uid())
) with check (
  exists (select 1 from prompts p where p.id = prompt_tags.prompt_id and p.author_id = auth.uid())
);

create policy "collections_public_read" on collections for select using (is_public);
create policy "collections_owner_all" on collections for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "collection_items_owner_all" on collection_items for all using (
  exists (select 1 from collections c where c.id = collection_items.collection_id and c.owner_id = auth.uid())
) with check (
  exists (select 1 from collections c where c.id = collection_items.collection_id and c.owner_id = auth.uid())
);

create policy "votes_user_all" on votes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;