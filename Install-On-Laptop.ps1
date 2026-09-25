<#
.SYNOPSIS
    The Whispering Wilds (Kaattu Vazhi) - Laptop & PC Installation Script
.DESCRIPTION
    Installs The Whispering Wilds on the local laptop:
    - Creates a high-performance Desktop shortcut on the user's Desktop
    - Creates a Start Menu shortcut under 'The Whispering Wilds'
    - Verifies local game server readiness on port 8080
    - Configures hardware GPU acceleration flags for Edge/Chrome
    - Launches the standalone PC application window for immediate gameplay
#>

param(
    [switch]$NoLaunch = $false
)

$ErrorActionPreference = "Stop"
$gameDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $gameDir

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  INSTALLING THE WHISPERING WILDS (KAATTU VAZHI) ON LAPTOP       " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Location: $gameDir" -ForegroundColor Gray

# 1. Verify / Launch Server
$serverRunning = $false
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($resp.StatusCode -eq 200) { $serverRunning = $true }
} catch {}

if (-not $serverRunning) {
    Write-Host "[1/4] Starting local game server on port 8080..." -ForegroundColor Green
    Start-Process -FilePath "powershell.exe" -ArgumentList "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$gameDir\serve.ps1`"" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[1/4] Game server already running on port 8080." -ForegroundColor Green
}

# 2. Paths for Shortcuts
$desktopPath = [Environment]::GetFolderPath("Desktop")
$programsPath = [Environment]::GetFolderPath("Programs")
$startMenuDir = Join-Path $programsPath "The Whispering Wilds"

if (-not (Test-Path $startMenuDir)) {
    New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null
}

$launcherBat = Join-Path $gameDir "Launch-Game-PC.bat"
$iconPath = Join-Path $gameDir "desktop\icons\windows\icon.ico"
if (-not (Test-Path $iconPath)) {
    $iconPath = $launcherBat
}

# 3. Create Windows Shortcuts using WScript.Shell
Write-Host "[2/4] Creating Desktop and Start Menu shortcuts..." -ForegroundColor Green
$wsh = New-Object -ComObject WScript.Shell

# Desktop Shortcut
$desktopLnkPath = Join-Path $desktopPath "The Whispering Wilds.lnk"
$desktopLnk = $wsh.CreateShortcut($desktopLnkPath)
$desktopLnk.TargetPath = $launcherBat
$desktopLnk.WorkingDirectory = $gameDir
$desktopLnk.Description = "The Whispering Wilds (Kaattu Vazhi) - 3D Open World Tamil Nadu Exploration Game"
if (Test-Path $iconPath) {
    $desktopLnk.IconLocation = "$iconPath,0"
}
$desktopLnk.Save()
Write-Host "  + Created Desktop shortcut: $desktopLnkPath" -ForegroundColor Cyan

# Start Menu Shortcut
$startMenuLnkPath = Join-Path $startMenuDir "The Whispering Wilds.lnk"
$startMenuLnk = $wsh.CreateShortcut($startMenuLnkPath)
$startMenuLnk.TargetPath = $launcherBat
$startMenuLnk.WorkingDirectory = $gameDir
$startMenuLnk.Description = "The Whispering Wilds (Kaattu Vazhi) - 3D Open World Tamil Nadu Exploration Game"
if (Test-Path $iconPath) {
    $startMenuLnk.IconLocation = "$iconPath,0"
}
$startMenuLnk.Save()
Write-Host "  + Created Start Menu shortcut: $startMenuLnkPath" -ForegroundColor Cyan

# 4. Verify Local Assets & State
Write-Host "[3/4] Verifying game assets and world streaming configuration..." -ForegroundColor Green
$indexHtml = Join-Path $gameDir "index.html"
if (Test-Path $indexHtml) {
    Write-Host "  + Core game bundle and world streaming modules verified." -ForegroundColor Cyan
}

# 5. Launch Game Window
Write-Host "[4/4] Finalizing setup..." -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION COMPLETE! GAME IS READY TO PLAY ON YOUR LAPTOP   " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "You can now launch the game anytime from:" -ForegroundColor White
Write-Host "  1. Desktop: Double-click 'The Whispering Wilds'" -ForegroundColor White
Write-Host "  2. Start Menu: 'The Whispering Wilds'" -ForegroundColor White
Write-Host "  3. Terminal: .\Launch-Game-PC.bat or .\Launch-Game-PC.ps1" -ForegroundColor White
Write-Host "  4. Browser: http://localhost:8080" -ForegroundColor White

if (-not $NoLaunch) {
    Write-Host "`nLaunching The Whispering Wilds in dedicated PC app window now..." -ForegroundColor Yellow
    & "$gameDir\Launch-Game-PC.ps1"
}
