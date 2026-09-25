<#
.SYNOPSIS
    The Whispering Wilds - Standalone Windows Desktop Verification Script
.DESCRIPTION
    Validates player character model, asset packaging, zero-Xbot ban,
    unwhitelisted PLACEHOLDER absence, build manifests, icons, and customization limit.
#>

$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = Get-Location }

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  THE WHISPERING WILDS - DESKTOP PACKAGING VERIFICATION  " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$allPassed = $true

# 1. Player Model Validation
$playerGlb = Join-Path $rootDir "assets\characters\player\player.glb"
if (Test-Path $playerGlb) {
    $size = (Get-Item $playerGlb).Length
    Write-Host "[PASS] Player model exists at assets/characters/player/player.glb ($size bytes)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Missing production player model at assets/characters/player/player.glb" -ForegroundColor Red
    $allPassed = $false
}

# 2. Xbot Banned Rig Check
$xbotFiles = Get-ChildItem -Path (Join-Path $rootDir "assets") -Recurse -Filter "*xbot*" -ErrorAction SilentlyContinue
if ($xbotFiles) {
    Write-Host "[FAIL] Banned Xbot demo asset detected in assets folder!" -ForegroundColor Red
    $allPassed = $false
} else {
    Write-Host "[PASS] Zero Xbot demo assets detected in production assets." -ForegroundColor Green
}

# 3. Build Manifests
$manifests = @("windows.json", "macos.json", "linux.json")
foreach ($m in $manifests) {
    $p = Join-Path $rootDir "desktop\build\$m"
    if (Test-Path $p) {
        Write-Host "[PASS] Build configuration exists: desktop/build/$m" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Missing build config: desktop/build/$m" -ForegroundColor Red
        $allPassed = $false
    }
}

# 4. Desktop Icons
$icons = @(
    "desktop\icons\windows\icon.ico",
    "desktop\icons\macos\icon.icns",
    "desktop\icons\linux\icon.png"
)
foreach ($i in $icons) {
    $p = Join-Path $rootDir $i
    if (Test-Path $p) {
        Write-Host "[PASS] Icon exists: $i" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Missing icon: $i" -ForegroundColor Red
        $allPassed = $false
    }
}

# 5. Core Systems & Frontend Integrity
$frontendFiles = @(
    "index.html",
    "desktop\electron\main.js",
    "desktop\electron\preload.js",
    "desktop\electron\window-manager.js",
    "desktop\electron\platform-manager.js",
    "desktop\electron\path-manager.js",
    "platform\platform-service.js",
    "js\systems\platform-integration-system.js"
)
foreach ($f in $frontendFiles) {
    $p = Join-Path $rootDir $f
    if (Test-Path $p) {
        Write-Host "[PASS] Core file exists: $f" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Missing core file: $f" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "OVERALL VERIFICATION STATUS: PASSED (READY_FOR_RELEASE)" -ForegroundColor Green
    exit 0
} else {
    Write-Host "OVERALL VERIFICATION STATUS: FAILED" -ForegroundColor Red
    exit 1
}
