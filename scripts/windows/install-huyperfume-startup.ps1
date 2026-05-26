[CmdletBinding()]
param(
    [ValidateSet('Install', 'Remove', 'Status')]
    [string]$Action = 'Install',
    [switch]$StartNow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$valueName = 'HuyPerfumeLocalApp'
$startScript = Join-Path $PSScriptRoot 'start-huyperfume.ps1'
$command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`""

if ($Action -eq 'Install') {
    New-Item -Path $runKey -Force | Out-Null
    New-ItemProperty -Path $runKey -Name $valueName -Value $command -PropertyType String -Force | Out-Null
    Write-Output 'Automatic startup installed for the current Windows user.'
    Write-Output "Command: $command"

    if ($StartNow) {
        & $startScript
    }
    exit 0
}

if ($Action -eq 'Remove') {
    Remove-ItemProperty -Path $runKey -Name $valueName -ErrorAction SilentlyContinue
    Write-Output 'Automatic startup removed for the current Windows user.'
    exit 0
}

$current = Get-ItemProperty -Path $runKey -Name $valueName -ErrorAction SilentlyContinue
if ($current) {
    Write-Output 'Automatic startup is installed.'
    Write-Output $current.$valueName
} else {
    Write-Output 'Automatic startup is not installed.'
}
