-- Seed data for Supabase (runs in SQL Editor)
begin;

-- Temporarily disable RLS to insert seed records
alter table users disable row level security;
alter table prompts disable row level security;
alter table prompt_versions disable row level security;

insert into users (id, handle, display_name)
values ('00000000-0000-0000-0000-000000000001', 'demo', 'Demo User')
on conflict (id) do nothing;

insert into prompts (id, author_id, name, description, status)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Hello World', 'First prompt in catalog', 'public')
on conflict (id) do nothing;

insert into prompt_versions (prompt_id, version, content, changelog, model_targets)
values ('10000000-0000-0000-0000-000000000001', 1, 'Say hello to the world.', 'initial seed', '{}')
on conflict (prompt_id, version) do nothing;

-- Re-enable RLS
alter table prompt_versions enable row level security;
alter table prompts enable row level security;
alter table users enable row level security;

commit;