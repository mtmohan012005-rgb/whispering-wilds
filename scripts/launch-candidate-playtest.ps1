# The Whispering Wilds - Candidate Release Verification and Launch Script
$ErrorActionPreference = "Stop"

$repoDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$zip = Join-Path $repoDir "artifacts\releases\TheWhisperingWilds-v1.0.0-windows-x64.zip"
$expectedHash = "AFF39CA7AA95516CA3E5EB8B5D7E33ACA456F877816734CD73E3CEA450705006"
$expectedSize = 62868410

if (-not (Test-Path $zip)) {
    throw "Candidate ZIP not found: $zip"
}

$file = Get-Item $zip
$actualHash = (Get-FileHash $zip -Algorithm SHA256).Hash

Write-Host "Verifying Candidate Archive..." -ForegroundColor Cyan
Write-Host "  Actual Size: $($file.Length) bytes (Expected: $expectedSize)"
Write-Host "  Actual Hash: $actualHash"

if ($file.Length -ne $expectedSize -or $actualHash -ne $expectedHash) {
    throw "Candidate ZIP verification FAILED. Do not launch this package."
}

Write-Host "PASS: Candidate ZIP size and SHA-256 match perfectly." -ForegroundColor Green

$destination = Join-Path $env:USERPROFILE "Games\WhisperingWilds-Candidate-5056deb"

if (Test-Path $destination) {
    Write-Host "Destination already exists. Refreshing destination folder..." -ForegroundColor Yellow
    Remove-Item -Path $destination -Recurse -Force
}

New-Item -ItemType Directory -Path $destination -Force | Out-Null
Write-Host "Extracting archive to: $destination ..." -ForegroundColor Cyan
Expand-Archive -LiteralPath $zip -DestinationPath $destination

$exe = Get-ChildItem -Path $destination -Filter "TheWhisperingWilds.exe" -Recurse | Select-Object -First 1

if (-not $exe) {
    throw "TheWhisperingWilds.exe was not found after extraction."
}

Write-Host "Found executable at: $($exe.FullName)" -ForegroundColor Green
Write-Host "Launching The Whispering Wilds (Candidate Build 5056deb)..." -ForegroundColor Magenta

Start-Process -FilePath $exe.FullName -WorkingDirectory $exe.DirectoryName

Write-Host "Game launched successfully! Proceed with interactive human playtest." -ForegroundColor Green
