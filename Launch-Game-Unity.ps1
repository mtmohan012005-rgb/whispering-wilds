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

# Potential executable locations (deliverable repo only)
$candidatePaths = @(
    (Join-Path $scriptDir "unity\Build\Windows\TheWhisperingWilds.exe"),
    (Join-Path $scriptDir "Build\Windows\TheWhisperingWilds.exe")
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
    Write-Host "     & 'C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe' -batchmode -quit -projectPath '$scriptDir\unity' -executeMethod WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindows" -ForegroundColor DarkCyan
    Write-Host ""
    exit 1
}

Write-Host "[LAUNCH] Executable found: $targetExe" -ForegroundColor Green
Write-Host "[LAUNCH] Target Architecture: Windows x64 Standalone (HDRP)" -ForegroundColor Green
Write-Host "[LAUNCH] Starting The Whispering Wilds..." -ForegroundColor Cyan

# Graphics API: let Unity auto-select. Forcing D3D12 fails on hosts where the
# D3D12 API is denied by the user filter (e.g. Intel integrated GPUs), so the
# build is allowed to fall back to Direct3D 11.
$graphicsArgs = @()
if ($env:WW_FORCE_D3D12 -eq "1") {
    $graphicsArgs += "-force-d3d12"
    Write-Host "[LAUNCH] Graphics API: Direct3D 12 (forced via WW_FORCE_D3D12=1)" -ForegroundColor Green
} else {
    Write-Host "[LAUNCH] Graphics API: auto (set WW_FORCE_D3D12=1 to force Direct3D 12)" -ForegroundColor Green
}

if ($graphicsArgs.Count -gt 0) {
    $proc = Start-Process -FilePath $targetExe -ArgumentList $graphicsArgs -WorkingDirectory (Split-Path -Parent $targetExe) -PassThru
} else {
    $proc = Start-Process -FilePath $targetExe -WorkingDirectory (Split-Path -Parent $targetExe) -PassThru
}
Start-Sleep -Seconds 3

if ($proc -and -not $proc.HasExited) {
    Write-Host "[STATUS] Game process successfully spawned (PID $($proc.Id))." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Game process exited immediately (exit code $($proc.ExitCode)). Check the Player.log." -ForegroundColor Red
    exit 1
}
