# The Whispering Wilds - Automated Standalone Release Packager
param(
    [string]$BuildDir = "unity/Build/Windows",
    [string]$ReleasesDir = "artifacts/releases",
    [string]$CommitSha = "1f15eb80eec90146dc0d0111595c2743607929c0"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

$resolvedBuildDir = Join-Path $rootDir $BuildDir
$resolvedReleasesDir = Join-Path $rootDir $ReleasesDir

if (!(Test-Path $resolvedBuildDir)) {
    throw "Build directory not found at $resolvedBuildDir"
}

if (!(Test-Path $resolvedReleasesDir)) {
    New-Item -ItemType Directory -Path $resolvedReleasesDir -Force | Out-Null
}

$stagingDir = Join-Path $resolvedReleasesDir "TheWhisperingWilds-v1.0.0-windows-x64"
if (Test-Path $stagingDir) {
    Remove-Item -Path $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

Write-Host "Staging release files from $resolvedBuildDir..." -ForegroundColor Cyan

# Copy essential runtime files
Copy-Item (Join-Path $resolvedBuildDir "TheWhisperingWilds.exe") $stagingDir
Copy-Item (Join-Path $resolvedBuildDir "UnityPlayer.dll") $stagingDir
Copy-Item (Join-Path $resolvedBuildDir "UnityCrashHandler64.exe") $stagingDir

$optionalDlls = @("DirectML.dll", "dstorage.dll", "dstoragecore.dll")
foreach ($dll in $optionalDlls) {
    $src = Join-Path $resolvedBuildDir $dll
    if (Test-Path $src) {
        Copy-Item $src $stagingDir
    }
}

$d3d12Dir = Join-Path $resolvedBuildDir "D3D12"
if (Test-Path $d3d12Dir) {
    Copy-Item $d3d12Dir $stagingDir -Recurse
}

Copy-Item (Join-Path $resolvedBuildDir "TheWhisperingWilds_Data") $stagingDir -Recurse
Copy-Item (Join-Path $resolvedBuildDir "MonoBleedingEdge") $stagingDir -Recurse

# Add README.txt
$readmeContent = @"
======================================================================
THE WHISPERING WILDS (காட்டு வழி) - v1.0.0 Windows x64 Standalone
======================================================================
Built with Unity 6000.6.3f1 (HDRP 17.7.0)
Target Platform: Windows 10/11 64-bit (Direct3D 11 / Direct3D 12)
Tested Code Commit SHA: $CommitSha

HOW TO RUN:
1. Extract all contents of this ZIP archive into a folder.
2. Double-click 'TheWhisperingWilds.exe' to launch the game.
3. Select your language preference (English or தமிழ்) on the initial menu.

INCLUDED PRODUCTION SCENES (9 Total):
- 00_Boot (Main Menu, Tamil/English Selector, Graphics & Audio Settings)
- 01_StateMap_TamilNadu (Interactive Geographic Overview, Region Selection Hub)
- 02_Chennai_GeorgeTown (Playable 3D Urban Market, Murugan NPC, Clues, Save/Load)
- 03_Pichavaram_Wetlands (Playable 3D Mangrove Delta & Bio-reserve)
- 04_Thanjavur_Delta (Playable 3D Paddy Fields & Cultural Landscape)
- 05_Chettinad_Mansion (Playable 3D Heritage Mansion Architecture)
- 06_Mamallapuram_Shore (Playable 3D Coastal Temple & Granite Monuments)
- 07_Nilgiris_Sanctuary (Playable 3D Mountain Forest & Tea Highlands)
- 08_Ancient_Temple_Ruins (Playable 3D Dravidian Temple Complex)

CONTROLS:
State Map View:
- Pan Camera: W / A / S / D or Click-and-Drag Mouse
- Zoom: Mouse Scroll Wheel
- Reset Camera: [R] key
- Select Region: Click any 3D marker pin on the map
- Travel: Click 'TRAVEL TO REGION' on the selected region card
- Quick Navigation: Click any region button in the bottom ribbon
- Return to Menu: Click [Back to Menu] in the top navigation bar

3D Regional Exploration:
- Move: W / A / S / D
- Sprint: Left Shift
- Crouch: [C] key
- Jump: Spacebar
- Look: Mouse Look
- Interact: [E] key (Talk to NPCs, examine clues)
- Journal: [J] key
- Open State Map & Auto-Save: [M] key
- Settings / Pause: Escape key

AUTHENTIC VERIFICATION & STATUS:
- Single-player exploration and quest loop: FULLY VERIFIED.
- Local atomic disk save: PASS_AUTOMATED & PASS_INTERACTIVE.
- Firebase Live Cloud Sync: BLOCKED_CREDENTIALS (requires remote staging keys).
- Authentic Field Audio: Procedural regional ambience active; authentic field recordings BLOCKED_EXTERNAL_ASSET pending field licensing.
- Simultaneous Two-Client Multiplayer: NOT_TESTED in single-player vertical slice.

======================================================================
"@

$readmePath = Join-Path $stagingDir "README.txt"
[System.IO.File]::WriteAllText($readmePath, $readmeContent, [System.Text.Encoding]::UTF8)

# Create ZIP archive
$zipPath = Join-Path $resolvedReleasesDir "TheWhisperingWilds-v1.0.0-windows-x64.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Write-Host "Compressing release package to $zipPath ..." -ForegroundColor Yellow
Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $zipPath -CompressionLevel Optimal

# Remove temporary staging folder
Remove-Item -Path $stagingDir -Recurse -Force

# Calculate checksum and size
$zipItem = Get-Item $zipPath
$zipHash = (Get-FileHash $zipPath -Algorithm SHA256).Hash
$sizeMB = [math]::Round($zipItem.Length / 1MB, 2)

$manifestData = @{
    package = "TheWhisperingWilds-v1.0.0-windows-x64.zip"
    version = "1.0.0"
    target = "Windows x64"
    unityVersion = "6000.6.3f1"
    renderPipeline = "HDRP 17.7.0"
    testedCommit = $CommitSha
    sizeBytes = $zipItem.Length
    sizeMB = $sizeMB
    sha256 = $zipHash
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    scenesIncluded = 9
}

$manifestJson = $manifestData | ConvertTo-Json -Depth 4
$manifestPath = Join-Path $resolvedReleasesDir "RELEASE_MANIFEST.json"
[System.IO.File]::WriteAllText($manifestPath, $manifestJson, [System.Text.Encoding]::UTF8)

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "RELEASE PACKAGE READY:" -ForegroundColor Green
Write-Host "File:    $($zipItem.FullName)" -ForegroundColor White
Write-Host "Size:    $sizeMB MB ($($zipItem.Length) bytes)" -ForegroundColor White
Write-Host "SHA-256: $zipHash" -ForegroundColor White
Write-Host "Manifest: $manifestPath" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
