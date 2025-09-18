-- Supabase RLS policies (starter)

-- Enable RLS
alter table users enable row level security;
alter table prompts enable row level security;
alter table prompt_versions enable row level security;
alter table tags enable row level security;
alter table prompt_tags enable row level security;
alter table collections enable row level security;
alter table collection_items enable row level security;
alter table votes enable row level security;

-- Helper: ensure app user row exists mapping to auth.uid()
-- In practice, create on signup via trigger/function.

-- Users: a user can select themself; insert/update their own row; admin can manage all.
drop policy if exists "users_self_select" on users;
create policy "users_self_select" on users
for select using (id = auth.uid());

drop policy if exists "users_self_upsert" on users;
create policy "users_self_upsert" on users
for all using (id = auth.uid()) with check (id = auth.uid());

-- Prompts
-- Public can read public prompts only
drop policy if exists "prompts_public_read" on prompts;
create policy "prompts_public_read" on prompts
for select using (status = 'public');

-- Authors can read their own prompts (any status)
drop policy if exists "prompts_author_read" on prompts;
create policy "prompts_author_read" on prompts
for select using (author_id = auth.uid());

-- Author can insert their own prompts
drop policy if exists "prompts_author_insert" on prompts;
create policy "prompts_author_insert" on prompts
for insert with check (author_id = auth.uid());

-- Author can update their own prompts
drop policy if exists "prompts_author_update" on prompts;
create policy "prompts_author_update" on prompts
for update using (author_id = auth.uid());

-- Prompt Versions
drop policy if exists "prompt_versions_read" on prompt_versions;
create policy "prompt_versions_read" on prompt_versions
for select using (exists (select 1 from prompts p where p.id = prompt_versions.prompt_id and (p.status = 'public' or p.author_id = auth.uid())));

drop policy if exists "prompt_versions_insert" on prompt_versions;
create policy "prompt_versions_insert" on prompt_versions
for insert with check (exists (select 1 from prompts p where p.id = prompt_versions.prompt_id and p.author_id = auth.uid()));

-- Tags: public read; only staff can write (add role later)
drop policy if exists "tags_public_read" on tags;
create policy "tags_public_read" on tags for select using (true);

-- Prompt Tags: author can tag their own prompts
drop policy if exists "prompt_tags_author_write" on prompt_tags;
create policy "prompt_tags_author_write" on prompt_tags
for all using (exists (select 1 from prompts p where p.id = prompt_tags.prompt_id and p.author_id = auth.uid()))
with check (exists (select 1 from prompts p where p.id = prompt_tags.prompt_id and p.author_id = auth.uid()));

-- Collections
-- Public read for public collections
drop policy if exists "collections_public_read" on collections;
create policy "collections_public_read" on collections for select using (is_public);
-- Owner full access
drop policy if exists "collections_owner_all" on collections;
create policy "collections_owner_all" on collections for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Collection Items: owner of collection can manage
drop policy if exists "collection_items_owner_all" on collection_items;
create policy "collection_items_owner_all" on collection_items
for all using (exists (select 1 from collections c where c.id = collection_items.collection_id and c.owner_id = auth.uid()))
with check (exists (select 1 from collections c where c.id = collection_items.collection_id and c.owner_id = auth.uid()));

-- Votes: user can upsert their vote
drop policy if exists "votes_user_all" on votes;
create policy "votes_user_all" on votes
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Templates RLS
alter table templates enable row level security;

-- Public can read system templates (user_id is null)
drop policy if exists "templates_public_read_system" on templates;
create policy "templates_public_read_system" on templates
for select using (user_id is null);

-- Owner can read their templates
drop policy if exists "templates_owner_read" on templates;
create policy "templates_owner_read" on templates
for select using (user_id = auth.uid());

-- Owner can insert their templates (must set user_id = auth.uid())
drop policy if exists "templates_owner_insert" on templates;
create policy "templates_owner_insert" on templates
for insert with check (user_id = auth.uid());

-- Owner can update their templates
drop policy if exists "templates_owner_update" on templates;
create policy "templates_owner_update" on templates
for update using (user_id = auth.uid());

-- Owner can delete their templates
drop policy if exists "templates_owner_delete" on templates;
create policy "templates_owner_delete" on templates
for delete using (user_id = auth.uid());