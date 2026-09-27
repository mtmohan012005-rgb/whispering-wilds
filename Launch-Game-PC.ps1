<#
.SYNOPSIS
    The Whispering Wilds (Kaattu Vazhi) - Standalone PC & Laptop PowerShell Launcher
.DESCRIPTION
    Ensures local server is active, applies high-performance GPU flags, and opens
    the game in dedicated standalone desktop application mode.
#>

$gameDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $gameDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  THE WHISPERING WILDS (KAATTU VAZHI) - PC & LAPTOP APP  " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Check local server port (prefer active port 8090, fallback to 3000)
$gamePort = 8090
$serverRunning = $false

try {
    $resp8090 = Invoke-WebRequest -Uri "http://localhost:8090/" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
    if ($resp8090.StatusCode -eq 200) {
        $serverRunning = $true
        $gamePort = 8090
    }
} catch {}

if (-not $serverRunning) {
    try {
        $resp3000 = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($resp3000.StatusCode -eq 200) {
            $serverRunning = $true
            $gamePort = 3000
        }
    } catch {}
}

if (-not $serverRunning) {
    Write-Host "Starting authoritative game server..." -ForegroundColor Green
    $nodePath = "C:\Program Files\nodejs\node.exe"
    if (Test-Path $nodePath) {
        Start-Process -FilePath $nodePath -ArgumentList "server.js" -WorkingDirectory $gameDir -WindowStyle Hidden
    } else {
        Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $gameDir -WindowStyle Hidden
    }
    Start-Sleep -Seconds 2
    $gamePort = 3000
} else {
    Write-Host "Local game server is active and healthy on port $gamePort!" -ForegroundColor Green
}

# 2. Locate browser for standalone window
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}

$appArgs = @(
    "--app=http://localhost:$gamePort",
    "--window-size=1920,1080",
    "--start-maximized",
    "--disable-features=TranslateUI",
    "--ignore-gpu-blocklist",
    "--enable-gpu-rasterization",
    "--enable-zero-copy"
)

if (Test-Path $edgePath) {
    Write-Host "Launching in Microsoft Edge Standalone Desktop Window..." -ForegroundColor Cyan
    Start-Process -FilePath $edgePath -ArgumentList $appArgs
} elseif (Test-Path $chromePath) {
    Write-Host "Launching in Google Chrome Standalone Desktop Window..." -ForegroundColor Cyan
    Start-Process -FilePath $chromePath -ArgumentList $appArgs
} else {
    Write-Host "Opening in default system browser..." -ForegroundColor Yellow
    Start-Process "http://localhost:$gamePort"
}

Write-Host "Game initialized! Have a wonderful expedition." -ForegroundColor Green
Start-Sleep -Seconds 2
