param(
  [string]$DataDir = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')).Path '.pgdata-pigeon-5433'),
  [int]$Port = 5433,
  [string]$Password = 'PAWAY1234',
  [string]$DbName = 'pigeonprompt'
)

$ErrorActionPreference = 'Stop'

# Ensure data directory exists
if (-not (Test-Path -LiteralPath $DataDir)) {
  New-Item -ItemType Directory -Path $DataDir | Out-Null
}

# Initialize database cluster if needed
$pgVersionFile = Join-Path $DataDir 'PG_VERSION'
if (-not (Test-Path -LiteralPath $pgVersionFile)) {
  Write-Host "Initializing PostgreSQL cluster at $DataDir"
  & initdb -D $DataDir -U postgres --auth-host=trust --auth-local=trust --encoding=UTF8 | Write-Host
  # Append basic settings
  $conf = Join-Path $DataDir 'postgresql.conf'
  Add-Content -Path $conf -Value ("`nlisten_addresses = '127.0.0.1'`nport = {0}`n" -f $Port)
  # Ensure pg_hba allows localhost without password for dev
  $hba = Join-Path $DataDir 'pg_hba.conf'
  Add-Content -Path $hba -Value "host    all             all             127.0.0.1/32            trust"
  Add-Content -Path $hba -Value "host    all             all             ::1/128                 trust"
}

# Start the server
$logFile = Join-Path $DataDir 'postgresql.log'
Write-Host "Starting postgres on port $Port"
& pg_ctl -D $DataDir -l $logFile -o ("-p {0} -h 127.0.0.1" -f $Port) start | Write-Host

# Wait for readiness (no password prompt due to trust)
$maxWait = 30
$ready = $false
for ($i = 0; $i -lt $maxWait; $i++) {
  & psql "postgresql://postgres@localhost:$Port/postgres" -w -c "select 1" 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 1
}
if (-not $ready) {
  throw "Postgres did not become ready on port $Port. Check log: $logFile"
}

# Set superuser password (even though pg_hba is trust, this seeds the password for app URLs)
Write-Host "Setting postgres superuser password"
& psql "postgresql://postgres@localhost:$Port/postgres" -w -c ("alter user postgres with password '{0}';" -f $Password) | Out-Null

# Create database if missing
Write-Host "Ensuring database exists: $DbName"
$exists = (& psql "postgresql://postgres@localhost:$Port/postgres" -At -t -w -c ("select 1 from pg_database where datname='{0}'" -f $DbName)).Trim()
if ($exists -ne '1') {
  & psql "postgresql://postgres@localhost:$Port/postgres" -w -c ("create database {0}" -f $DbName) | Out-Null
}

Write-Host "Local Postgres is ready on port $Port with DB '$DbName'"