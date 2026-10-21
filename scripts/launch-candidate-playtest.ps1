<#
.SYNOPSIS
    The Whispering Wilds - Candidate Release Verification and Safe Launch Script
.DESCRIPTION
    Verifies the integrity of the candidate ZIP archive against artifacts/releases/RELEASE_MANIFEST.json,
    maintains an extraction provenance marker (.candidate-archive.json), prevents duplicate instances,
    safely refreshes stale or corrupted candidate extractions, and launches with -force-d3d11 for stable
    Intel UHD graphics under HDRP.
.PARAMETER DestinationPath
    Target extraction folder. Defaults to $env:USERPROFILE\Games\WhisperingWilds-Candidate-5056deb.
.PARAMETER ZipPath
    Path to candidate archive. Defaults to artifacts/releases/TheWhisperingWilds-v1.0.0-windows-x64.zip.
.PARAMETER ManifestPath
    Path to candidate release manifest. Defaults to artifacts/releases/RELEASE_MANIFEST.json.
.PARAMETER SkipExtract
    If specified, reuses existing destination folder ONLY if it passes full provenance verification.
    If provenance verification fails, throws an error rather than refreshing.
.PARAMETER ForceRefresh
    Forces re-extraction of the candidate archive even if the existing destination folder is valid.
.PARAMETER TestMode
    Validates manifest, archive, destination provenance, and generates launch scripts without starting
    the actual game process.
.PARAMETER SimulateProcessRunning
    For testing: simulates an already-running game process check.
#>
[CmdletBinding()]
param(
    [string]$DestinationPath = "",
    [string]$ZipPath = "",
    [string]$ManifestPath = "",
    [switch]$SkipExtract,
    [switch]$ForceRefresh,
    [switch]$TestMode,
    [switch]$SimulateProcessRunning
)

$ErrorActionPreference = "Stop"

$repoDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if ([string]::IsNullOrWhiteSpace($ZipPath)) {
    $ZipPath = Join-Path $repoDir "artifacts\releases\TheWhisperingWilds-v1.0.0-windows-x64.zip"
}
if ([string]::IsNullOrWhiteSpace($ManifestPath)) {
    $ManifestPath = Join-Path $repoDir "artifacts\releases\RELEASE_MANIFEST.json"
}
if ([string]::IsNullOrWhiteSpace($DestinationPath)) {
    $DestinationPath = Join-Path $env:USERPROFILE "Games\WhisperingWilds-Candidate-5056deb"
}

# 1. Manifest Validation
Write-Host "Verifying Release Manifest..." -ForegroundColor Cyan
if (-not (Test-Path $ManifestPath)) {
    throw "Candidate release manifest not found at: $ManifestPath"
}

try {
    $manifestContent = Get-Content -Path $ManifestPath -Raw | ConvertFrom-Json
} catch {
    throw "Candidate release manifest is malformed JSON: $($_.Exception.Message)"
}

$expectedHash = $manifestContent.sha256
$expectedSize = [int64]$manifestContent.sizeBytes
$expectedCommit = if ($manifestContent.codeCommit) { $manifestContent.codeCommit } else { $manifestContent.testedCommit }

if ([string]::IsNullOrWhiteSpace($expectedHash) -or $expectedSize -le 0 -or [string]::IsNullOrWhiteSpace($expectedCommit)) {
    throw "Release manifest is missing required candidate metadata (sha256, sizeBytes, codeCommit)."
}

Write-Host "  Manifest Expected Hash:   $expectedHash"
Write-Host "  Manifest Expected Size:   $expectedSize bytes"
Write-Host "  Candidate Code Commit:    $expectedCommit"

# 2. Archive Verification
Write-Host "Verifying Candidate Archive..." -ForegroundColor Cyan
if (-not (Test-Path $ZipPath)) {
    throw "Candidate ZIP archive not found: $ZipPath"
}

$file = Get-Item $ZipPath
$actualHash = (Get-FileHash $ZipPath -Algorithm SHA256).Hash

Write-Host "  Actual Archive Size:      $($file.Length) bytes"
Write-Host "  Actual Archive Hash:      $actualHash"

if ($file.Length -ne $expectedSize) {
    throw "Candidate ZIP verification FAILED: Size mismatch. Actual $($file.Length) bytes != Expected $expectedSize bytes."
}

if ($actualHash.ToUpperInvariant() -ne $expectedHash.ToUpperInvariant()) {
    throw "Candidate ZIP verification FAILED: SHA-256 hash mismatch. Actual $actualHash != Expected $expectedHash."
}

Write-Host "PASS: Candidate archive integrity verified against manifest." -ForegroundColor Green

# 3. Check for Already Running Game Process
$runningProcesses = Get-Process -Name "TheWhisperingWilds" -ErrorAction SilentlyContinue
if (($runningProcesses -or $SimulateProcessRunning) -and -not $TestMode) {
    $pids = if ($runningProcesses) { ($runningProcesses | Select-Object -ExpandProperty Id) -join ", " } else { "Simulated" }
    throw "The Whispering Wilds candidate process is already running (PID: $pids). Avoid launching duplicate instances. Please switch to the running game window or close it before relaunching."
}

# 4. Provenance Validation Function
function Test-CandidateProvenance {
    param([string]$Dir)

    if (-not (Test-Path $Dir)) {
        return @{ Valid = $false; Reason = "Directory does not exist" }
    }

    $markerFile = Join-Path $Dir ".candidate-archive.json"
    $exeFile = Join-Path $Dir "TheWhisperingWilds.exe"
    $dataDir = Join-Path $Dir "TheWhisperingWilds_Data"

    if (-not (Test-Path $exeFile)) {
        return @{ Valid = $false; Reason = "TheWhisperingWilds.exe missing in candidate folder" }
    }

    if (-not (Test-Path $dataDir)) {
        return @{ Valid = $false; Reason = "TheWhisperingWilds_Data directory missing in candidate folder" }
    }

    if (-not (Test-Path $markerFile)) {
        return @{ Valid = $false; Reason = "Provenance marker (.candidate-archive.json) missing" }
    }

    try {
        $marker = Get-Content -Path $markerFile -Raw | ConvertFrom-Json
    } catch {
        return @{ Valid = $false; Reason = "Provenance marker is malformed JSON" }
    }

    if ($marker.archive_sha256 -ne $expectedHash) {
        return @{ Valid = $false; Reason = "Marker archive hash mismatch: $($marker.archive_sha256) != $expectedHash" }
    }

    if ([int64]$marker.archive_size -ne $expectedSize) {
        return @{ Valid = $false; Reason = "Marker archive size mismatch: $($marker.archive_size) != $expectedSize" }
    }

    if ($marker.candidate_code_commit -ne $expectedCommit) {
        return @{ Valid = $false; Reason = "Marker candidate code commit mismatch: $($marker.candidate_code_commit) != $expectedCommit" }
    }

    return @{ Valid = $true; Reason = "OK"; Marker = $marker }
}

$destCanonical = [System.IO.Path]::GetFullPath($DestinationPath)
$markerPath = Join-Path $destCanonical ".candidate-archive.json"
$exePath = Join-Path $destCanonical "TheWhisperingWilds.exe"
$dataPath = Join-Path $destCanonical "TheWhisperingWilds_Data"

# 5. Determine whether extraction or reuse is needed
$provenance = Test-CandidateProvenance -Dir $destCanonical
$needExtract = $false

if ($ForceRefresh) {
    Write-Host "Force refresh requested. Refreshing candidate folder..." -ForegroundColor Yellow
    $needExtract = $true
} elseif (-not (Test-Path $destCanonical)) {
    Write-Host "Destination folder does not exist. Initializing extraction..." -ForegroundColor Cyan
    $needExtract = $true
} elseif ($provenance.Valid) {
    Write-Host "PASS: Destination provenance verified (SHA-256 and commit match archive)." -ForegroundColor Green
    Write-Host "  Extracted at: $($provenance.Marker.extracted_at_utc)"
    $needExtract = $false
} else {
    if ($SkipExtract) {
        throw "Candidate destination '$DestinationPath' failed provenance verification ($($provenance.Reason)). Cannot launch with -SkipExtract when marker or extracted files are stale/invalid. Run without -SkipExtract to refresh safely."
    }
    Write-Host "Destination folder exists but failed provenance check: $($provenance.Reason)" -ForegroundColor Yellow
    Write-Host "Safely refreshing dedicated candidate destination..." -ForegroundColor Cyan
    $needExtract = $true
}

# 6. Safe Extraction & Marker Writing
if ($needExtract) {
    # Guard against accidental deletion of root or userprofile
    $userProfilePath = [System.IO.Path]::GetFullPath($env:USERPROFILE)
    if ($destCanonical -eq $userProfilePath -or $destCanonical.Length -lt 15) {
        throw "Safety guard: Refusing to clean invalid destination path '$destCanonical'."
    }

    if (Test-Path $destCanonical) {
        # Delete marker first to ensure a failed extraction never leaves a valid marker
        if (Test-Path $markerPath) {
            Remove-Item -Path $markerPath -Force -ErrorAction SilentlyContinue
        }
        Remove-Item -Path $destCanonical -Recurse -Force
    }

    New-Item -ItemType Directory -Path $destCanonical -Force | Out-Null
    Write-Host "Extracting verified archive to: $destCanonical ..." -ForegroundColor Cyan

    try {
        Expand-Archive -LiteralPath $ZipPath -DestinationPath $destCanonical -Force
    } catch {
        if (Test-Path $markerPath) {
            Remove-Item -Path $markerPath -Force -ErrorAction SilentlyContinue
        }
        throw "Failed to extract candidate archive: $($_.Exception.Message)"
    }

    # Verify extracted structure before writing success marker
    if (-not (Test-Path $exePath) -or -not (Test-Path $dataPath)) {
        if (Test-Path $markerPath) {
            Remove-Item -Path $markerPath -Force -ErrorAction SilentlyContinue
        }
        throw "Extraction finished but required files ('TheWhisperingWilds.exe' or 'TheWhisperingWilds_Data') are missing."
    }

    # Write provenance marker
    $markerObject = [ordered]@{
        archive_sha256 = $expectedHash
        archive_size = $expectedSize
        candidate_code_commit = $expectedCommit
        extracted_at_utc = (Get-Date).ToUniversalTime().ToString("o")
    }

    $markerJson = ConvertTo-Json -InputObject $markerObject -Depth 4
    [System.IO.File]::WriteAllText($markerPath, $markerJson, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Wrote provenance marker (.candidate-archive.json)." -ForegroundColor Green
}

# 7. Generate Protected Play-Candidate.bat Inside Destination
$batTemplate = @"
@echo off
setlocal
cd /d "%~dp0"
echo ==============================================================
echo  The Whispering Wilds - Candidate Release Launcher
echo ==============================================================

if not exist ".candidate-archive.json" (
    echo [ERROR] Provenance marker (.candidate-archive.json) missing!
    echo Refusing to launch unverified candidate directory.
    echo Please run Play-Candidate-Build.bat from the repository to re-extract.
    pause
    exit /b 1
)

if not exist "TheWhisperingWilds.exe" (
    echo [ERROR] TheWhisperingWilds.exe missing in candidate folder!
    pause
    exit /b 1
)

if not exist "TheWhisperingWilds_Data" (
    echo [ERROR] TheWhisperingWilds_Data folder missing in candidate folder!
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "`$m = Get-Content -Path '.candidate-archive.json' -Raw | ConvertFrom-Json; if (`$m.archive_sha256 -ne '$expectedHash' -or `$m.candidate_code_commit -ne '$expectedCommit') { exit 2 }"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Candidate provenance validation failed!
    echo This extracted directory does not match candidate commit $expectedCommit.
    echo Please run Play-Candidate-Build.bat to refresh extraction.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "if (Get-Process -Name 'TheWhisperingWilds' -ErrorAction SilentlyContinue) { exit 3 }"
if %ERRORLEVEL% equ 3 (
    echo [ERROR] The Whispering Wilds is already running. Duplicate instances are not permitted.
    pause
    exit /b 1
)

echo [OK] Provenance verified for candidate commit $expectedCommit.
echo Launching The Whispering Wilds (-force-d3d11)...
start "" "%~dp0TheWhisperingWilds.exe" -force-d3d11
"@

Set-Content -Path (Join-Path $destCanonical "Play-Candidate.bat") -Value $batTemplate -Encoding Ascii

# 8. Execution
if ($TestMode) {
    Write-Host "TestMode active: All checks and provenance generation passed successfully. Process launch skipped." -ForegroundColor Green
    return
}

Write-Host "Found executable at: $exePath" -ForegroundColor Green
Write-Host "Launching The Whispering Wilds (Candidate Build $expectedCommit) with -force-d3d11..." -ForegroundColor Magenta

Start-Process -FilePath $exePath -WorkingDirectory $destCanonical -ArgumentList "-force-d3d11"

Write-Host "Game launched successfully! Proceed with interactive human playtest." -ForegroundColor Green
