<#
.SYNOPSIS
    The Whispering Wilds - Candidate Release Verification and Safe Launch Script
.DESCRIPTION
    Verifies the integrity of the candidate ZIP archive against artifacts/releases/RELEASE_MANIFEST.json,
    enforces strict destination path allowlists and reparse-point guards, protects arbitrary user folders
    from destructive cleanup, validates deterministic payload manifests (hashes of extracted files),
    prevents duplicate game processes, and launches with -force-d3d11 for stable Intel UHD graphics under HDRP.
.PARAMETER DestinationPath
    Target extraction folder. Defaults to $env:USERPROFILE\Games\WhisperingWilds-Candidate-5056deb.
.PARAMETER ZipPath
    Path to candidate archive. Defaults to artifacts/releases/TheWhisperingWilds-v1.0.0-windows-x64.zip.
.PARAMETER ManifestPath
    Path to candidate release manifest. Defaults to artifacts/releases/RELEASE_MANIFEST.json.
.PARAMETER SkipExtract
    If specified, reuses existing destination folder ONLY if it passes full provenance and payload verification.
    If provenance verification fails, throws an error rather than refreshing.
.PARAMETER ForceRefresh
    Forces re-extraction of the candidate archive into an allowed application-owned folder.
.PARAMETER TestMode
    Validates manifest, archive, destination safety, payload verification, and generates launch scripts
    without starting the actual game process. Requires destination to be inside the OS temporary directory.
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

# -----------------------------------------------------------------------------
# 1. Strict Path Safety Validation
# -----------------------------------------------------------------------------
function Assert-DestinationSafety {
    param(
        [string]$PathToCheck,
        [bool]$InTestMode
    )

    if ([string]::IsNullOrWhiteSpace($PathToCheck)) {
        throw "Safety guard: Destination path cannot be empty."
    }

    # Reject path traversal tokens, UNC shares, and device namespaces
    if ($PathToCheck -match '\.\.' -or $PathToCheck -match '^[/\\]{2}' -or $PathToCheck -match '^\\\\(\.|\?)\\') {
        throw "Safety guard: Path traversal, UNC, or device namespaces are not permitted: '$PathToCheck'."
    }

    $canonical = [System.IO.Path]::GetFullPath($PathToCheck)

    # Reject drive roots (e.g. C:\, D:\)
    $pathRoot = [System.IO.Path]::GetPathRoot($canonical)
    if ($canonical.TrimEnd('\', '/') -eq $pathRoot.TrimEnd('\', '/')) {
        throw "Safety guard: Destination cannot be a drive root: '$canonical'."
    }

    # Prohibit ReparsePoints / Symlinks / Junctions
    if (Test-Path $canonical) {
        $item = Get-Item -LiteralPath $canonical -Force
        if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
            throw "Safety guard: Reparse points, symlinks, or directory junctions are strictly prohibited: '$canonical'."
        }
    }

    # Protected system, user profile, and repository directories
    $protectedPaths = @(
        [System.IO.Path]::GetFullPath($repoDir),
        [System.IO.Path]::GetFullPath($env:USERPROFILE),
        [System.IO.Path]::GetFullPath([Environment]::GetFolderPath('Desktop')),
        [System.IO.Path]::GetFullPath([Environment]::GetFolderPath('MyDocuments')),
        [System.IO.Path]::GetFullPath((Join-Path $env:USERPROFILE "Downloads")),
        [System.IO.Path]::GetFullPath([Environment]::GetFolderPath('ProgramFiles')),
        [System.IO.Path]::GetFullPath([Environment]::GetFolderPath('CommonProgramFiles')),
        [System.IO.Path]::GetFullPath([Environment]::GetFolderPath('Windows')),
        [System.IO.Path]::GetFullPath([Environment]::GetFolderPath('System'))
    )

    foreach ($prot in $protectedPaths) {
        if (-not [string]::IsNullOrWhiteSpace($prot)) {
            $protNorm = $prot.TrimEnd('\', '/')
            $destNorm = $canonical.TrimEnd('\', '/')
            if ($destNorm -eq $protNorm) {
                throw "Safety guard: Destination matches protected system or user directory: '$canonical'."
            }
            if ($protNorm.StartsWith($destNorm + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
                throw "Safety guard: Destination is an ancestor of protected directory '$protNorm': '$canonical'."
            }
        }
    }

    # Canonicalize paths and verify parent directories before any delete
    $parent = [System.IO.Directory]::GetParent($canonical)
    while ($parent -ne $null) {
        if ($parent.Exists -and ($parent.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
            throw "Safety guard: Reparse points or junctions in parent directory hierarchy are strictly prohibited: '$($parent.FullName)'."
        }
        $parent = $parent.Parent
    }

    # In TestMode: destination must be an isolated temporary path under OS temp directory
    if ($InTestMode) {
        $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\', '/')
        if (-not $canonical.StartsWith($tempRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Safety guard (-TestMode): In TestMode, destination must be an isolated path under the OS temp directory: '$canonical'."
        }
        return $canonical
    }

    # In normal launch mode: must match the application-owned candidate directory pattern
    $allowedGamesPrefix = [System.IO.Path]::GetFullPath((Join-Path $env:USERPROFILE "Games\WhisperingWilds-Candidate-")).TrimEnd('\', '/')
    $isAllowedPrefix = $canonical.StartsWith($allowedGamesPrefix, [System.StringComparison]::OrdinalIgnoreCase)

    if (-not $isAllowedPrefix) {
        if (Test-Path $canonical) {
            $existingItems = Get-ChildItem -LiteralPath $canonical -Force -ErrorAction SilentlyContinue
            if ($existingItems -and $existingItems.Count -gt 0) {
                throw "Safety guard: Destination '$canonical' is not in the dedicated application Games folder ($allowedGamesPrefix*) and is not empty. A missing or malformed provenance marker must never authorize recursive deletion of an arbitrary existing folder. Please choose an empty directory or use the default candidate location."
            }
        }
    }

    return $canonical
}

$destCanonical = Assert-DestinationSafety -PathToCheck $DestinationPath -InTestMode ([bool]$TestMode)
$markerPath = Join-Path $destCanonical ".candidate-archive.json"
$exePath = Join-Path $destCanonical "TheWhisperingWilds.exe"
$dataPath = Join-Path $destCanonical "TheWhisperingWilds_Data"

# -----------------------------------------------------------------------------
# 2. Release Manifest Validation & Schema Enforcement
# -----------------------------------------------------------------------------
Write-Host "Verifying Release Manifest..." -ForegroundColor Cyan
if (-not (Test-Path $ManifestPath)) {
    throw "Candidate release manifest not found at: $ManifestPath"
}

try {
    $manifestRaw = Get-Content -Path $ManifestPath -Raw
    # Strip potential UTF-8 BOM
    if ($manifestRaw.Length -gt 0 -and [int]$manifestRaw[0] -eq 65279) {
        $manifestRaw = $manifestRaw.Substring(1)
    }
    $manifestContent = $manifestRaw | ConvertFrom-Json
} catch {
    throw "Candidate release manifest is malformed JSON: $($_.Exception.Message)"
}

# Strict schema checks
if ($manifestContent.candidate -ne $true) {
    throw "Manifest schema error: candidate must be true for playtest release candidate."
}
if ($manifestContent.status -ne "VERIFIED_CLEAN") {
    throw "Manifest schema error: status must be 'VERIFIED_CLEAN' (found '$($manifestContent.status)')."
}
if ($manifestContent.isDirty -ne $false) {
    throw "Manifest schema error: isDirty must be false for verified candidate."
}

$expectedHash = $manifestContent.sha256
$expectedSize = [int64]$manifestContent.sizeBytes
$expectedCommit = if ($manifestContent.codeCommit) { $manifestContent.codeCommit } else { $manifestContent.testedCommit }

if ([string]::IsNullOrWhiteSpace($expectedHash) -or $expectedHash -notmatch '^[0-9a-fA-F]{64}$') {
    throw "Manifest error: sha256 must be a valid 64-character hexadecimal SHA-256 hash."
}
if ($expectedSize -le 0) {
    throw "Manifest error: sizeBytes must be greater than zero."
}
if ([string]::IsNullOrWhiteSpace($expectedCommit) -or $expectedCommit -notmatch '^[0-9a-fA-F]{40}$') {
    throw "Manifest error: candidate code commit must be a valid 40-character hexadecimal SHA."
}

Write-Host "  Manifest Expected Hash:   $expectedHash"
Write-Host "  Manifest Expected Size:   $expectedSize bytes"
Write-Host "  Candidate Code Commit:    $expectedCommit"

# -----------------------------------------------------------------------------
# 3. Candidate Archive Verification & ZIP Path Traversal Protection
# -----------------------------------------------------------------------------
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

# Inspect ZIP entries for path traversal vulnerabilities
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipArchive = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $ZipPath).Path)
try {
    foreach ($entry in $zipArchive.Entries) {
        $entryName = $entry.FullName
        if ($entryName -match '^\s*[/\\]' -or $entryName -match '\.\.[/\\]' -or $entryName -match '^[a-zA-Z]:') {
            throw "Security check failed: Candidate ZIP contains unsafe path traversal entry: '$entryName'."
        }
    }
} finally {
    $zipArchive.Dispose()
}

Write-Host "PASS: Candidate archive integrity verified against manifest (entries safe)." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 4. Check for Already Running Game Process
# -----------------------------------------------------------------------------
$runningProcesses = Get-Process -Name "TheWhisperingWilds" -ErrorAction SilentlyContinue
if (($runningProcesses -and -not $TestMode) -or $SimulateProcessRunning) {
    $pids = if ($runningProcesses) { ($runningProcesses | Select-Object -ExpandProperty Id) -join ", " } else { "Simulated" }
    throw "The Whispering Wilds candidate process is already running (PID: $pids). Avoid launching duplicate instances. Please switch to the running game window or close it before relaunching."
}

# -----------------------------------------------------------------------------
# 5. Provenance & Payload Manifest Validation Function
# -----------------------------------------------------------------------------
function Compute-FileSha256 {
    param([string]$FilePath)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $stream = [System.IO.File]::OpenRead($FilePath)
        try {
            $bytes = $sha.ComputeHash($stream)
            return [System.BitConverter]::ToString($bytes).Replace("-", "").ToUpperInvariant()
        } finally {
            $stream.Close()
        }
    } finally {
        $sha.Dispose()
    }
}

function Test-CandidateProvenance {
    param([string]$Dir)

    if (-not (Test-Path $Dir)) {
        return @{ Valid = $false; Reason = "Directory does not exist" }
    }

    $markerFile = Join-Path $Dir ".candidate-archive.json"
    $localExe = Join-Path $Dir "TheWhisperingWilds.exe"
    $localData = Join-Path $Dir "TheWhisperingWilds_Data"

    if (-not (Test-Path $localExe)) {
        return @{ Valid = $false; Reason = "TheWhisperingWilds.exe missing in candidate folder" }
    }
    if (-not (Test-Path $localData)) {
        return @{ Valid = $false; Reason = "TheWhisperingWilds_Data directory missing in candidate folder" }
    }
    if (-not (Test-Path $markerFile)) {
        return @{ Valid = $false; Reason = "Provenance marker (.candidate-archive.json) missing" }
    }

    try {
        $markerRaw = Get-Content -Path $markerFile -Raw
        if ($markerRaw.Length -gt 0 -and [int]$markerRaw[0] -eq 65279) {
            $markerRaw = $markerRaw.Substring(1)
        }
        $marker = $markerRaw | ConvertFrom-Json
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

    # Verify payload manifest integrity (checks for modified, tampered, or missing files)
    if ($marker.payload_manifest) {
        foreach ($prop in $marker.payload_manifest.PSObject.Properties) {
            $relPath = $prop.Name
            $expectedFileInfo = $prop.Value
            $targetFilePath = Join-Path $Dir $relPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)

            if (-not (Test-Path $targetFilePath)) {
                return @{ Valid = $false; Reason = "Payload file missing: $relPath" }
            }

            $currentFile = Get-Item $targetFilePath
            if ($currentFile.Length -ne [int64]$expectedFileInfo.size) {
                return @{ Valid = $false; Reason = "Payload file size mismatch for $relPath (Expected: $($expectedFileInfo.size), Found: $($currentFile.Length))" }
            }

            # Check hash on critical binaries
            if ($expectedFileInfo.sha256 -and ($relPath -eq "TheWhisperingWilds.exe" -or $relPath.StartsWith("TheWhisperingWilds_Data/") -or $relPath -eq "UnityPlayer.dll")) {
                $actualFileHash = Compute-FileSha256 -FilePath $targetFilePath
                if ($actualFileHash -ne $expectedFileInfo.sha256) {
                    return @{ Valid = $false; Reason = "Payload file hash mismatch for $relPath (tampered or modified binary)" }
                }
            }
        }
    }

    return @{ Valid = $true; Reason = "OK"; Marker = $marker }
}

# -----------------------------------------------------------------------------
# 6. Determine Whether Extraction or Reuse Is Needed
# -----------------------------------------------------------------------------
$provenance = Test-CandidateProvenance -Dir $destCanonical
$needExtract = $false

if ($ForceRefresh) {
    Write-Host "Force refresh requested. Refreshing candidate folder..." -ForegroundColor Yellow
    $needExtract = $true
} elseif (-not (Test-Path $destCanonical)) {
    Write-Host "Destination folder does not exist. Initializing extraction..." -ForegroundColor Cyan
    $needExtract = $true
} elseif ($provenance.Valid) {
    Write-Host "PASS: Destination provenance verified (SHA-256, commit, and payload match archive)." -ForegroundColor Green
    Write-Host "  Extracted at: $($provenance.Marker.extracted_at_utc)"
    $needExtract = $false
} else {
    if ($SkipExtract) {
        throw "Candidate destination '$destCanonical' failed provenance verification ($($provenance.Reason)). Cannot launch with -SkipExtract when marker or extracted files are stale/invalid. Run without -SkipExtract to refresh safely."
    }
    Write-Host "Destination folder exists but failed provenance check: $($provenance.Reason)" -ForegroundColor Yellow
    Write-Host "Safely refreshing dedicated candidate destination..." -ForegroundColor Cyan
    $needExtract = $true
}

# -----------------------------------------------------------------------------
# 7. Safe Extraction, Payload Manifest Generation, and Marker Writing
# -----------------------------------------------------------------------------
if ($needExtract) {
    if (Test-Path $destCanonical) {
        # Fail-closed guard: if the folder exists and has files, ensure it is demonstrably application-owned
        $existingItems = Get-ChildItem -LiteralPath $destCanonical -Force
        if ($existingItems.Count -gt 0) {
            $hasMarker = Test-Path (Join-Path $destCanonical ".candidate-archive.json")
            $hasExe = Test-Path (Join-Path $destCanonical "TheWhisperingWilds.exe")
            # If neither marker nor game exe is present in an existing folder, fail closed!
            if (-not $hasMarker -and -not $hasExe -and -not $TestMode) {
                throw "Safety guard: Destination folder '$destCanonical' already contains files but lacks candidate provenance. To prevent accidental data loss, the launcher refuses to recursively delete unverified directories. Please specify an empty destination directory."
            }
        }

        # Delete marker first to ensure a failed extraction never leaves a valid marker
        if (Test-Path $markerPath) {
            Remove-Item -LiteralPath $markerPath -Force -ErrorAction SilentlyContinue
        }
        Remove-Item -LiteralPath $destCanonical -Recurse -Force
    }

    New-Item -ItemType Directory -Path $destCanonical -Force | Out-Null
    Write-Host "Extracting verified archive to: $destCanonical ..." -ForegroundColor Cyan

    try {
        Expand-Archive -LiteralPath $ZipPath -DestinationPath $destCanonical -Force
    } catch {
        if (Test-Path $markerPath) {
            Remove-Item -LiteralPath $markerPath -Force -ErrorAction SilentlyContinue
        }
        throw "Failed to extract candidate archive: $($_.Exception.Message)"
    }

    # Verify extracted structure before writing success marker
    if (-not (Test-Path $exePath) -or -not (Test-Path $dataPath)) {
        if (Test-Path $markerPath) {
            Remove-Item -LiteralPath $markerPath -Force -ErrorAction SilentlyContinue
        }
        throw "Extraction finished but required files ('TheWhisperingWilds.exe' or 'TheWhisperingWilds_Data') are missing."
    }

    $exeItem = Get-Item -LiteralPath $exePath -Force
    $dataItem = Get-Item -LiteralPath $dataPath -Force
    if (($exeItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -or ($dataItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
        if (Test-Path $markerPath) {
            Remove-Item -LiteralPath $markerPath -Force -ErrorAction SilentlyContinue
        }
        throw "Security check failed: Extracted payload contains reparse point or symbolic link."
    }

    # Construct deterministic payload manifest
    Write-Host "Computing payload manifest for extracted files..." -ForegroundColor Cyan
    $extractedFiles = Get-ChildItem -Path $destCanonical -Recurse -File |
        Where-Object { $_.Name -ne ".candidate-archive.json" -and $_.Name -ne "Play-Candidate.bat" -and $_.Extension -ne ".log" } |
        Sort-Object FullName

    $payloadDict = [ordered]@{ }
    foreach ($ef in $extractedFiles) {
        $rel = $ef.FullName.Substring($destCanonical.Length + 1).Replace('\', '/')
        $fileHash = ""
        # Hash critical executables and data
        if ($rel -eq "TheWhisperingWilds.exe" -or $rel.StartsWith("TheWhisperingWilds_Data/") -or $rel -eq "UnityPlayer.dll") {
            $fileHash = Compute-FileSha256 -FilePath $ef.FullName
        }
        $payloadDict[$rel] = [ordered]@{
            size = $ef.Length
            sha256 = $fileHash
        }
    }

    # Write provenance marker
    $markerObject = [ordered]@{
        archive_sha256 = $expectedHash
        archive_size = $expectedSize
        candidate_code_commit = $expectedCommit
        extracted_at_utc = (Get-Date).ToUniversalTime().ToString("o")
        payload_files_count = $extractedFiles.Count
        payload_manifest = $payloadDict
    }

    $markerJson = ConvertTo-Json -InputObject $markerObject -Depth 6
    [System.IO.File]::WriteAllText($markerPath, $markerJson, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Wrote provenance marker (.candidate-archive.json) with $($extractedFiles.Count) verified payload entries." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 8. Generate Protected Play-Candidate.bat Inside Destination
# -----------------------------------------------------------------------------
$batTemplate = @"
@echo off
setlocal
cd /d "%~dp0"
echo ==============================================================
echo  The Whispering Wilds - Candidate Release Launcher
echo ==============================================================

if not exist ".candidate-archive.json" (
    echo [ERROR] Provenance marker .candidate-archive.json missing!
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

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "`$ErrorActionPreference = 'Stop'; `$m = Get-Content -Path '.candidate-archive.json' -Raw | ConvertFrom-Json; if (`$m.archive_sha256 -ne '$expectedHash' -or `$m.candidate_code_commit -ne '$expectedCommit') { exit 2 }; `$sha = [System.Security.Cryptography.SHA256]::Create(); `$exe = (Resolve-Path 'TheWhisperingWilds.exe').Path; `$s = [System.IO.File]::OpenRead(`$exe); `$h = [System.BitConverter]::ToString(`$sha.ComputeHash(`$s)).Replace('-', ''); `$s.Close(); if (`$m.payload_manifest -and `$m.payload_manifest.'TheWhisperingWilds.exe'.sha256 -and `$h -ne `$m.payload_manifest.'TheWhisperingWilds.exe'.sha256) { exit 3 }"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Candidate provenance or executable integrity validation failed [exit %ERRORLEVEL%]!
    echo The executable or marker in this directory does not match candidate commit $expectedCommit.
    echo Please run Play-Candidate-Build.bat to refresh extraction.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "if (Get-Process -Name 'TheWhisperingWilds' -ErrorAction SilentlyContinue) { exit 4 }"
if %ERRORLEVEL% equ 4 (
    echo [ERROR] The Whispering Wilds is already running. Duplicate instances are not permitted.
    pause
    exit /b 1
)

echo [OK] Provenance and executable integrity verified for candidate commit $expectedCommit.
echo Launching The Whispering Wilds (-force-d3d11)...
start "" "%~dp0TheWhisperingWilds.exe" -force-d3d11
"@

Set-Content -Path (Join-Path $destCanonical "Play-Candidate.bat") -Value $batTemplate -Encoding Ascii

# -----------------------------------------------------------------------------
# 9. Execution Gate
# -----------------------------------------------------------------------------
if ($TestMode) {
    Write-Host "TestMode active: All safety guards, archive checks, payload verification, and script generation passed successfully. Process launch skipped." -ForegroundColor Green
    return
}

Write-Host "Found executable at: $exePath" -ForegroundColor Green
Write-Host "Launching The Whispering Wilds (Candidate Build $expectedCommit) with -force-d3d11..." -ForegroundColor Magenta

Start-Process -FilePath $exePath -WorkingDirectory $destCanonical -ArgumentList "-force-d3d11"

Write-Host "Game launched successfully! Proceed with interactive human playtest." -ForegroundColor Green
