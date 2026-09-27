<#
.SYNOPSIS
    The Whispering Wilds - Laptop & PC Desktop Installer
.DESCRIPTION
    Creates Windows Desktop and Start Menu shortcuts with native icons,
    configures standalone app mode, and launches the game on the laptop.
#>

$ErrorActionPreference = "Stop"
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALLING THE WHISPERING WILDS (KAATTU VAZHI) ON PC     " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# Paths using authoritative Windows SpecialFolders API
$desktopPath = [Environment]::GetFolderPath('Desktop')
if (-not (Test-Path $desktopPath)) {
    $desktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
    if (-not (Test-Path $desktopPath)) {
        New-Item -ItemType Directory -Path $desktopPath -Force | Out-Null
    }
}
$startMenuPath = [Environment]::GetFolderPath('Programs')
$launcherBat = [System.IO.Path]::Combine($projectDir, "The-Whispering-Wilds.bat")
$launcherPs1 = [System.IO.Path]::Combine($projectDir, "Launch-Game-PC.ps1")
$iconPath = [System.IO.Path]::Combine($projectDir, "desktop\icons\windows\icon.ico")

$wscriptShell = New-Object -ComObject WScript.Shell

# 1. Desktop Shortcut
$desktopShortcutPath = [System.IO.Path]::Combine($desktopPath, "The Whispering Wilds.lnk")
Write-Host "Creating Desktop Shortcut: $desktopShortcutPath" -ForegroundColor Green
$shortcut = $wscriptShell.CreateShortcut($desktopShortcutPath)
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPs1`""
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = "The Whispering Wilds (Kaattu Vazhi) - 3D Exploration & Investigation Adventure"
if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath,0"
}
$shortcut.Save()

# 2. Start Menu Shortcut
if (Test-Path $startMenuPath) {
    $startMenuShortcutPath = [System.IO.Path]::Combine($startMenuPath, "The Whispering Wilds.lnk")
    Write-Host "Creating Start Menu Shortcut: $startMenuShortcutPath" -ForegroundColor Green
    $smShortcut = $wscriptShell.CreateShortcut($startMenuShortcutPath)
    $smShortcut.TargetPath = "powershell.exe"
    $smShortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPs1`""
    $smShortcut.WorkingDirectory = $projectDir
    $smShortcut.Description = "The Whispering Wilds (Kaattu Vazhi)"
    if (Test-Path $iconPath) {
        $smShortcut.IconLocation = "$iconPath,0"
    }
    $smShortcut.Save()
}

# 3. Direct Batch Launcher on Desktop for instant double-click
$desktopBatPath = [System.IO.Path]::Combine($desktopPath, "Play-Whispering-Wilds.bat")
Copy-Item -Path $launcherBat -Destination $desktopBatPath -Force
Write-Host "Created Desktop Direct Launcher: $desktopBatPath" -ForegroundColor Green

Write-Host "`nInstallation Completed Successfully!" -ForegroundColor Cyan
Write-Host "Now launching standalone desktop game window on your laptop..." -ForegroundColor Yellow

# 4. Launch Game
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $launcherPs1
