$backupDir = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Backups\2026-11-01_Step2_PostChange"
$repoRoot = "c:\Users\mohan\.gemini\antigravity\scratch\whispering-wilds"
$saveDir = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "unity_scripts") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "unity_scenes") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "save_data") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "docs_reports") | Out-Null

Write-Host "Backing up modified and created Step 2 scripts..."
$filesToBackup = @(
    "unity\Assets\_Project\Scripts\Player\PlayerMovement.cs",
    "unity\Assets\_Project\Scripts\Player\PlayerInputHandler.cs",
    "unity\Assets\_Project\Scripts\Player\PlayerInteractor.cs",
    "unity\Assets\_Project\Scripts\Player\PlayerManager.cs",
    "unity\Assets\_Project\Scripts\Camera\CameraController.cs",
    "unity\Assets\_Project\Scripts\UI\InGamePauseMenuUI.cs",
    "unity\Assets\_Project\Scripts\UI\InGamePauseMenuUI.cs.meta",
    "unity\Assets\_Project\Scripts\UI\IntroductionTutorialUI.cs",
    "unity\Assets\_Project\Scripts\UI\IntroductionTutorialUI.cs.meta",
    "unity\Assets\_Project\Scripts\Gameplay\GameplayRegionBootstrap.cs",
    "unity\Assets\_Project\Scripts\Localization\LocalizationManager.cs",
    "unity\Assets\_Project\Tests\Editor\Step2PlayerControllerTests.cs",
    "unity\Assets\_Project\Tests\Editor\Step2PlayerControllerTests.cs.meta",
    "scripts\verify-step2-controller.js",
    "scripts\run-all-tests.js"
)
foreach ($rel in $filesToBackup) {
    $src = Join-Path $repoRoot $rel
    if (Test-Path $src) {
        $dest = Join-Path (Join-Path $backupDir "unity_scripts") (Split-Path $rel -Leaf)
        Copy-Item -Path $src -Destination $dest -Force
    }
}

Write-Host "Backing up Chennai scene..."
Copy-Item -Path (Join-Path $repoRoot "unity\Assets\_Project\Scenes\02_Chennai_GeorgeTown.unity") -Destination (Join-Path $backupDir "unity_scenes") -Force

Write-Host "Backing up user save data..."
Get-ChildItem -Path $saveDir -File -Filter "*.json" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir "save_data") -Force
}

Write-Host "Backing up test reports and docs..."
Copy-Item -Path (Join-Path $repoRoot "docs\audits\AUTONOMOUS_HUMAN_PLAYTHROUGH_REPORT.json") -Destination (Join-Path $backupDir "docs_reports") -Force -ErrorAction SilentlyContinue

Write-Host "Generating backup manifest with SHA-256 hashes..."
$manifest = @()
Get-ChildItem -Path $backupDir -Recurse -File | ForEach-Object {
    $hash = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
    $manifest += [PSCustomObject]@{
        Name = $_.Name
        RelativePath = $_.FullName.Substring($backupDir.Length + 1)
        SizeBytes = $_.Length
        SHA256 = $hash
    }
}

$manifestPath = Join-Path $backupDir "BACKUP_MANIFEST.json"
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host "Creating compressed archive..."
$zipPath = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Backups\2026-11-01_Step2_PostChange_Backup.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$backupDir\*" -DestinationPath $zipPath -Force

Write-Host "POST-STEP-2 BACKUP COMPLETE: $zipPath"
Write-Host "Total files backed up: $($manifest.Count)"
