[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runtimePath = Join-Path $root '.runtime'

foreach ($name in @('frontend-admin', 'frontend-user', 'api')) {
    $recordPath = Join-Path $runtimePath "$name.pid.json"
    if (-not (Test-Path $recordPath)) {
        continue
    }

    $record = Get-Content -Raw -LiteralPath $recordPath | ConvertFrom-Json
    $process = Get-Process -Id $record.id -ErrorAction SilentlyContinue
    if ($process -and $process.StartTime.ToUniversalTime().Ticks -eq [long]$record.startTimeTicks) {
        Stop-Process -Id $process.Id -Force
        Write-Output "Stopped $name (PID $($process.Id))."
    }

    Remove-Item -LiteralPath $recordPath -Force -ErrorAction SilentlyContinue
}
