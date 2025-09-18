$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

. "$PSScriptRoot\load-env.ps1" -EncodeDatabasePassword

if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL not loaded from .env"
  exit 1
}

Write-Host ("Using database: " + ([Uri]$env:DATABASE_URL).Host)

& "$PSScriptRoot\migrate.ps1" -Mode supabase -DatabaseUrl $env:DATABASE_URL

& "$PSScriptRoot\seed.ps1" -DatabaseUrl $env:DATABASE_URL

Write-Host "`n✅ Supabase migration + seed complete."