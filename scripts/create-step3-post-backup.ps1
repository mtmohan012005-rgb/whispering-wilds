$backupDir = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Backups\2026-11-01_Step3_PostChange"
$repoRoot = "c:\Users\mohan\.gemini\antigravity\scratch\whispering-wilds"
$saveDir = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "campaign_scripts") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "ui_and_hud_scripts") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "test_scripts") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "save_data") | Out-Null

Write-Host "Backing up post-change Step 3 files..."
$filesToBackup = @(
    "unity\Assets\_Project\Scripts\Core\CampaignFlow.cs",
    "unity\Assets\_Project\Scripts\Core\SaveManager.cs",
    "unity\Assets\_Project\Scripts\Core\SaveSystem.cs",
    "unity\Assets\_Project\Scripts\Quests\QuestManager.cs",
    "unity\Assets\_Project\Scripts\World\RegionalSceneManager.cs",
    "unity\Assets\_Project\Scripts\Gameplay\GameplayRegionBootstrap.cs",
    "unity\Assets\_Project\Scripts\Localization\LocalizationManager.cs",
    "unity\Assets\_Project\Scripts\UI\IntroductionTutorialUI.cs",
    "unity\Assets\_Project\Scripts\UI\ObjectiveTrackerHUD.cs",
    "unity\Assets\_Project\Scripts\UI\ObjectiveTrackerHUD.cs.meta",
    "unity\Assets\_Project\Tests\Editor\Step3CampaignFlowTests.cs",
    "unity\Assets\_Project\Tests\Editor\Step3CampaignFlowTests.cs.meta",
    "scripts\verify-step3-campaign.js",
    "scripts\run-all-tests.js"
)

foreach ($rel in $filesToBackup) {
    $src = Join-Path $repoRoot $rel
    if (Test-Path $src) {
        $destSub = if ($rel -match "UI|HUD") { "ui_and_hud_scripts" } elseif ($rel -match "Test|test") { "test_scripts" } else { "campaign_scripts" }
        Copy-Item -Path $src -Destination (Join-Path $backupDir $destSub) -Force
    }
}

Write-Host "Backing up current user save data..."
Get-ChildItem -Path $saveDir -File -Filter "*.json" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir "save_data") -Force
}

Write-Host "Generating SHA-256 manifest..."
$manifest = @()
Get-ChildItem -Path $backupDir -Recurse -File | Where-Object { $_.Name -ne "MANIFEST_SHA256.json" } | ForEach-Object {
    $sha = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
    $rel = $_.FullName.Substring($backupDir.Length + 1)
    $manifest += [PSCustomObject]@{
        Path = $rel
        SHA256 = $sha
        Length = $_.Length
    }
}
$manifest | ConvertTo-Json -Depth 4 | Out-File -FilePath (Join-Path $backupDir "MANIFEST_SHA256.json") -Encoding UTF8

Write-Host "Creating recoverable ZIP archive..."
$zipPath = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Backups\2026-11-01_Step3_PostChange_Backup.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $backupDir "*") -DestinationPath $zipPath -CompressionLevel Optimal

$zipSha = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash
Write-Host "POST-STEP-3 BACKUP COMPLETED CLEANLY."
Write-Host "Archive: $zipPath"
Write-Host "Archive SHA-256: $zipSha"
Write-Host "Item count: $($manifest.Count)"
