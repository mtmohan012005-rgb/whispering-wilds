$backupDir = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Backups\2026-11-01_Step2_PreStep2"
$repoRoot = "c:\Users\mohan\.gemini\antigravity\scratch\whispering-wilds"
$saveDir = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "player_and_camera_scripts") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "world_and_scene_scripts") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "save_data") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "docs_reports") | Out-Null

Write-Host "Backing up player and camera scripts..."
Get-ChildItem -Path (Join-Path $repoRoot "unity\Assets\_Project\Scripts\Player") -File | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir "player_and_camera_scripts") -Force
}
Get-ChildItem -Path (Join-Path $repoRoot "unity\Assets\_Project\Scripts\Camera") -File | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir "player_and_camera_scripts") -Force
}

Write-Host "Backing up Chennai world and campaign scripts..."
$worldFiles = @(
    "unity\Assets\_Project\Scripts\Data\ChennaiOpeningContent.cs",
    "unity\Assets\_Project\Scripts\Data\ChennaiOpeningContent.cs.meta",
    "unity\Assets\_Project\Scripts\Editor\World\BuildChennaiStreet.cs",
    "unity\Assets\_Project\Scripts\Editor\World\BuildChennaiStreet.cs.meta",
    "unity\Assets\_Project\Scripts\Editor\World\BuildChennaiPopulation.cs",
    "unity\Assets\_Project\Scripts\Editor\World\BuildChennaiPopulation.cs.meta",
    "unity\Assets\_Project\Scripts\Core\CampaignFlow.cs",
    "unity\Assets\_Project\Scripts\Core\CampaignFlow.cs.meta",
    "unity\Assets\_Project\Scripts\World\RegionalSceneManager.cs",
    "unity\Assets\_Project\Scripts\World\RegionalSceneManager.cs.meta",
    "unity\Assets\_Project\Scripts\UI\TitleMenuController.cs",
    "unity\Assets\_Project\Scripts\UI\TitleMenuController.cs.meta"
)
foreach ($rel in $worldFiles) {
    $src = Join-Path $repoRoot $rel
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $backupDir "world_and_scene_scripts") -Force
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
$zipPath = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Backups\2026-11-01_Step2_PreStep2_Backup.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$backupDir\*" -DestinationPath $zipPath -Force

Write-Host "PRE-STEP-2 BACKUP COMPLETE: $zipPath"
Write-Host "Total files backed up: $($manifest.Count)"
