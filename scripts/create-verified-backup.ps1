$backupDir = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Backups\2026-11-01_Step1_PreSync"
$repoRoot = "c:\Users\mohan\.gemini\antigravity\scratch\whispering-wilds"
$saveDir = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "unity_scripts_ui") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "save_data") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backupDir "docs_reports") | Out-Null

Write-Host "Backing up Step 1 scripts and UI assets..."
$filesToBackup = @(
    "unity\Assets\_Project\Scripts\UI\TitleMenuController.cs",
    "unity\Assets\_Project\Scripts\UI\LoginUI.cs",
    "unity\Assets\_Project\Scripts\UI\SavedGamesUI.cs",
    "unity\Assets\_Project\Scripts\UI\SavedGamesUI.cs.meta",
    "unity\Assets\_Project\Scripts\UI\CreditsUI.cs",
    "unity\Assets\_Project\Scripts\UI\CreditsUI.cs.meta",
    "unity\Assets\_Project\Scripts\Localization\LocalizationManager.cs",
    "unity\Assets\_Project\Scripts\Editor\BuildBootScene.cs",
    "unity\Assets\_Project\Resources\UI\AppLogo.png",
    "unity\Assets\_Project\Resources\UI\AppLogo.png.meta",
    "unity\Assets\_Project\Resources\UI\AppIcon.png",
    "unity\Assets\_Project\Resources\UI\AppIcon.png.meta",
    "unity\Assets\_Project\Resources\UI\MainMenuBackground.png",
    "unity\Assets\_Project\Resources\UI\MainMenuBackground.png.meta",
    "assets\ui\menu\main_menu_characters_background.png"
)

foreach ($rel in $filesToBackup) {
    $src = Join-Path $repoRoot $rel
    if (Test-Path $src) {
        $dest = Join-Path (Join-Path $backupDir "unity_scripts_ui") (Split-Path $rel -Leaf)
        Copy-Item -Path $src -Destination $dest -Force
    }
}

Write-Host "Backing up existing save games and runtime telemetry..."
Get-ChildItem -Path $saveDir -File -Filter "*.json" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir "save_data") -Force
}
Get-ChildItem -Path $saveDir -File -Filter "*.xml" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir "save_data") -Force
}
Get-ChildItem -Path $saveDir -File -Filter "*.txt" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir "save_data") -Force
}

Write-Host "Backing up test reports and docs..."
Copy-Item -Path (Join-Path $repoRoot "docs\audits\AUTONOMOUS_HUMAN_PLAYTHROUGH_REPORT.json") -Destination (Join-Path $backupDir "docs_reports") -Force -ErrorAction SilentlyContinue
Copy-Item -Path (Join-Path $repoRoot "docs\screenshots\*.png") -Destination (Join-Path $backupDir "docs_reports") -Force -ErrorAction SilentlyContinue

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
$zipPath = "C:\Users\mohan\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Backups\2026-11-01_Step1_Backup.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$backupDir\*" -DestinationPath $zipPath -Force

Write-Host "BACKUP COMPLETE: $zipPath"
Write-Host "Total files backed up: $($manifest.Count)"
