<#
.SYNOPSIS
    The Whispering Wilds (Kaattu Vazhi) - Standalone Unity 6 Windows Production Launcher
.DESCRIPTION
    Launches the native compiled Unity 6000.6.3f1 Windows x64 standalone executable.
    Does NOT depend on Chrome, Edge, Node.js, Electron, localhost, or browser runtime.
#>

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "      THE WHISPERING WILDS (காட்டு வழி • தடம்) - UNITY 6       " -ForegroundColor Yellow
Write-Host "           Windows x64 Native Standalone Game Client            " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Potential executable locations
$candidatePaths = @(
    (Join-Path $scriptDir "Build\Windows\TheWhisperingWilds.exe"),
    (Join-Path $scriptDir "unity\Build\Windows\TheWhisperingWilds.exe"),
    "C:\Users\mohan\My project\Build\Windows\TheWhisperingWilds.exe"
)

$targetExe = $null
foreach ($path in $candidatePaths) {
    if (Test-Path $path) {
        $targetExe = $path
        break
    }
}

if (-not $targetExe) {
    Write-Host "[ERROR] Unity 6 Standalone Windows Executable not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Expected location: Build\Windows\TheWhisperingWilds.exe" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To compile the production Windows executable:" -ForegroundColor White
    Write-Host "  1. Open the project in Unity 6000.6.3f1" -ForegroundColor Gray
    Write-Host "  2. In top menu, select: Tools > Whispering Wilds > Build Production Windows x64 (Retail)" -ForegroundColor Gray
    Write-Host "  or run automated build via batchmode:" -ForegroundColor Gray
    Write-Host "     & 'C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe' -batchmode -quit -projectPath 'C:\Users\mohan\My project' -executeMethod WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindows" -ForegroundColor DarkCyan
    Write-Host ""
    exit 1
}

Write-Host "[LAUNCH] Executable found: $targetExe" -ForegroundColor Green
Write-Host "[LAUNCH] Target Architecture: Windows x64 Standalone (DirectX 12 / HDRP)" -ForegroundColor Green
Write-Host "[LAUNCH] Starting The Whispering Wilds..." -ForegroundColor Cyan

Start-Process -FilePath $targetExe -WorkingDirectory (Split-Path -Parent $targetExe)
Write-Host "[STATUS] Game process successfully spawned." -ForegroundColor Green
