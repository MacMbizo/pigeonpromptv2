param(
  [string]$Path,
  [switch]$EncodeDatabasePassword
)

if (-not $Path) {
  $Path = Join-Path (Split-Path $PSScriptRoot -Parent) '.env'
}

if (-not (Test-Path $Path)) {
  Write-Error "Env file not found: $Path"
  exit 1
}

Get-Content $Path | ForEach-Object {
  $line = $_.Trim()
  if ($line.Length -eq 0 -or $line.StartsWith('#')) { return }
  $eq = $line.IndexOf('=')
  if ($eq -lt 0) { return }
  $key = $line.Substring(0, $eq).Trim()
  $val = $line.Substring($eq + 1).Trim()
  if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Trim('"') }
  if ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Trim("'") }
  # Set both the process environment and the PowerShell Env: drive
  [Environment]::SetEnvironmentVariable($key, $val, 'Process')
  Set-Item -Path ("Env:" + $key) -Value $val -ErrorAction SilentlyContinue | Out-Null
}

if ($EncodeDatabasePassword -and $env:DATABASE_URL) {
  if ($env:DATABASE_URL -match '^(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@.+)$') {
    $prefix = $Matches[1]
    $pwd    = $Matches[2]
    $suffix = $Matches[3]
    $pwd = [System.Uri]::EscapeDataString($pwd)
    $env:DATABASE_URL = $prefix + $pwd + $suffix
    [Environment]::SetEnvironmentVariable('DATABASE_URL', $env:DATABASE_URL, 'Process')
  }
}

Write-Host "Loaded env from $Path"