$backupDir = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Backups\2026-11-01_Step3_PreStep3"
$repoRoot = "c:\Users\mohan\.gemini\antigravity\scratch\whispering-wilds"
$saveDir = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "campaign_and_quest_scripts") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "world_and_scene_scripts") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "ui_scripts") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "save_data") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "docs_reports") | Out-Null

Write-Host "Backing up Campaign and Quest scripts..."
$campaignFiles = @(
    "unity\Assets\_Project\Scripts\Core\CampaignFlow.cs",
    "unity\Assets\_Project\Scripts\Core\CampaignFlow.cs.meta",
    "unity\Assets\_Project\Scripts\Core\SaveManager.cs",
    "unity\Assets\_Project\Scripts\Core\SaveManager.cs.meta",
    "unity\Assets\_Project\Scripts\Core\SaveSystem.cs",
    "unity\Assets\_Project\Scripts\Core\SaveSystem.cs.meta",
    "unity\Assets\_Project\Scripts\Core\SaveMigrator.cs",
    "unity\Assets\_Project\Scripts\Core\SaveMigrator.cs.meta",
    "unity\Assets\_Project\Scripts\Quests\QuestManager.cs",
    "unity\Assets\_Project\Scripts\Quests\QuestManager.cs.meta",
    "unity\Assets\_Project\Scripts\Data\QuestData.cs",
    "unity\Assets\_Project\Scripts\Data\QuestData.cs.meta",
    "unity\Assets\_Project\Scripts\Data\ChennaiOpeningContent.cs",
    "unity\Assets\_Project\Scripts\Data\ChennaiOpeningContent.cs.meta",
    "unity\Assets\_Project\Scripts\Gameplay\GameplayRegionBootstrap.cs",
    "unity\Assets\_Project\Scripts\Gameplay\GameplayRegionBootstrap.cs.meta"
)
foreach ($rel in $campaignFiles) {
    $src = Join-Path $repoRoot $rel
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $backupDir "campaign_and_quest_scripts") -Force
    }
}

Write-Host "Backing up World and Navigation scripts..."
$worldFiles = @(
    "unity\Assets\_Project\Scripts\World\RegionalSceneManager.cs",
    "unity\Assets\_Project\Scripts\World\RegionalSceneManager.cs.meta",
    "unity\Assets\_Project\Scripts\World\RegionUnlocks.cs",
    "unity\Assets\_Project\Scripts\World\RegionUnlocks.cs.meta",
    "unity\Assets\_Project\Scripts\World\TamilNaduGeography.cs",
    "unity\Assets\_Project\Scripts\World\TamilNaduGeography.cs.meta"
)
foreach ($rel in $worldFiles) {
    $src = Join-Path $repoRoot $rel
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $backupDir "world_and_scene_scripts") -Force
    }
}

Write-Host "Backing up UI scripts..."
$uiFiles = @(
    "unity\Assets\_Project\Scripts\UI\TitleMenuController.cs",
    "unity\Assets\_Project\Scripts\UI\TitleMenuController.cs.meta",
    "unity\Assets\_Project\Scripts\UI\HUDManager.cs",
    "unity\Assets\_Project\Scripts\UI\HUDManager.cs.meta",
    "unity\Assets\_Project\Scripts\UI\InGamePauseMenuUI.cs",
    "unity\Assets\_Project\Scripts\UI\InGamePauseMenuUI.cs.meta",
    "unity\Assets\_Project\Scripts\UI\IntroductionTutorialUI.cs",
    "unity\Assets\_Project\Scripts\UI\IntroductionTutorialUI.cs.meta",
    "unity\Assets\_Project\Scripts\UI\SavedGamesUI.cs",
    "unity\Assets\_Project\Scripts\UI\SavedGamesUI.cs.meta",
    "unity\Assets\_Project\Scripts\UI\StateMapUI.cs",
    "unity\Assets\_Project\Scripts\UI\StateMapUI.cs.meta"
)
foreach ($rel in $uiFiles) {
    $src = Join-Path $repoRoot $rel
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $backupDir "ui_scripts") -Force
    }
}

Write-Host "Backing up user save data..."
Get-ChildItem -Path $saveDir -File -Filter "*.json" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir "save_data") -Force
}

Write-Host "Backing up test reports and docs..."
Copy-Item -Path (Join-Path $repoRoot "docs\audits\AUTONOMOUS_HUMAN_PLAYTHROUGH_REPORT.json") -Destination (Join-Path $backupDir "docs_reports") -Force -ErrorAction SilentlyContinue

Write-Host "Generating backup manifest with SHA-256 hashes..."
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
$zipPath = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Backups\2026-11-01_Step3_PreStep3_Backup.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $backupDir "*") -DestinationPath $zipPath -CompressionLevel Optimal

$zipSha = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash
Write-Host "PRE-STEP-3 BACKUP COMPLETED CLEANLY."
Write-Host "Archive: $zipPath"
Write-Host "Archive SHA-256: $zipSha"
Write-Host "Item count: $($manifest.Count)"
