param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [ValidateSet('auto','local','supabase')] [string]$Mode = 'auto',
  [string]$SchemaFile = "schema.sql",
  [string]$IndexesFile = "indexes.sql",
  [string]$PoliciesFile = "policies.sql",
  [string]$LocalAuthUserId = "00000000-0000-0000-0000-000000000001"
)

if (-not $DatabaseUrl) {
  Write-Error "DATABASE_URL is not set. Provide --DatabaseUrl or set env var."
  exit 1
}

$ErrorActionPreference = 'Stop'

function Invoke-PsqlFile($file) {
  if (Test-Path $file) {
    Write-Host "\n>> Applying $file"
    psql $DatabaseUrl -v "ON_ERROR_STOP=1" -f $file
    if ($LASTEXITCODE -ne 0) { throw "psql failed applying $file (exit $LASTEXITCODE)" }
  } else {
    Write-Warning "Skipping missing file: $file"
  }
}

function Invoke-PsqlText([string]$sql) {
  psql $DatabaseUrl -v "ON_ERROR_STOP=1" -c $sql
  if ($LASTEXITCODE -ne 0) { throw "psql failed executing inline SQL (exit $LASTEXITCODE)" }
}

Set-Location $PSScriptRoot

$useLocalShim = $Mode -eq 'local' -or ($Mode -eq 'auto' -and -not $env:SUPABASE_URL)

$modeLabel = if ($useLocalShim) { 'local (auth shim enabled)' } else { 'supabase' }
Write-Host ("`n==> Migration mode: {0}" -f $modeLabel)

Invoke-PsqlFile $SchemaFile
Invoke-PsqlFile $IndexesFile
 
 if ($useLocalShim) {
   Write-Host "\n>> Installing local auth shim (auth.uid())"
   $shimTemplate = @'
create schema if not exists auth;

create or replace function auth.uid() returns uuid
language sql stable
as $fn$
  select coalesce(
    nullif(current_setting($q$request.jwt.claim.sub$q$, true), $e$$e$)::uuid,
    $u${0}$u$::uuid
  );
$fn$;
'@
   $shim = ($shimTemplate -f $LocalAuthUserId)
   Invoke-PsqlText $shim
 }
  
  Invoke-PsqlFile $PoliciesFile
  
  Write-Host "\n✅ Migration completed."