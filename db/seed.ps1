param(
  [string]$DatabaseUrl = $env:DATABASE_URL
)

if (-not $DatabaseUrl) {
  Write-Error "DATABASE_URL is not set. Provide --DatabaseUrl or set env var."
  exit 1
}

$ErrorActionPreference = 'Stop'

$seed = @"
-- Minimal seed data for local dev (compatible with schema.sql)

insert into users (id, handle, display_name)
values ('00000000-0000-0000-0000-000000000001', 'demo', 'Demo User')
on conflict (id) do nothing;

insert into prompts (id, author_id, name, description, status)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Hello World', 'First prompt in catalog', 'public')
on conflict (id) do nothing;

insert into prompt_versions (prompt_id, version, content, changelog, model_targets)
values ('10000000-0000-0000-0000-000000000001', 1, 'Say hello to the world.', 'initial seed', '{}')
on conflict (prompt_id, version) do nothing;
"@

Set-Location $PSScriptRoot

$seed | psql $DatabaseUrl -v "ON_ERROR_STOP=1"
if ($LASTEXITCODE -ne 0) { throw "psql failed seeding data (exit $LASTEXITCODE)" }

Write-Host "\n✅ Seed completed."