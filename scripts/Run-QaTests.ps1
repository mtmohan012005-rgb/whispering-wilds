<#
.SYNOPSIS
    Runs Unity PlayMode or EditMode tests with QA-isolated save directory.
.DESCRIPTION
    Sets WW_SAVE_DIR environment variable before launching Unity so that
    SaveSystem.SaveDirectory resolves to a temporary QA path instead of
    the real player save directory. This prevents automated tests from
    damaging real player data.
.PARAMETER TestMode
    "EditMode" or "PlayMode". Default: "PlayMode".
.PARAMETER TestFilter
    NUnit test filter (e.g. "WhisperingWilds.Tests.PlayMode"). Default: runs all tests in the selected mode.
.EXAMPLE
    .\Run-QaTests.ps1
    .\Run-QaTests.ps1 -TestMode EditMode
    .\Run-QaTests.ps1 -TestMode PlayMode -TestFilter "CampaignProgressionTests"
#>
param(
    [ValidateSet("EditMode", "PlayMode")]
    [string]$TestMode = "PlayMode",

    [string]$TestFilter = ""
)

$ErrorActionPreference = "Stop"

# --- Configuration ---
# Repo root is one level above scripts/
$repoRoot = Split-Path $PSScriptRoot -Parent
$unityProjectDir = Join-Path $repoRoot "unity"
$unityExe = "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe"

# All QA artifacts go into a unique temp directory — never into the repository
$qaTempRoot = Join-Path $env:TEMP "ww_qa_$(Get-Date -Format 'yyyyMMddHHmmss')_$((New-Guid).ToString('N').Substring(0, 8))"
New-Item -ItemType Directory -Force -Path $qaTempRoot | Out-Null

# QA save directory is separate from log directory
$qaSaveDir = Join-Path $qaTempRoot "saves"
New-Item -ItemType Directory -Force -Path $qaSaveDir | Out-Null

# Timestamp for log files
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$unityLog = Join-Path $qaTempRoot "unity_${TestMode}_${timestamp}.log"
$resultXml = Join-Path $qaTempRoot "test_results_${TestMode}_${timestamp}.xml"

Write-Host "========================================"
Write-Host "Whispering Wilds QA Test Runner"
Write-Host "========================================"
Write-Host "Unity: $unityExe"
Write-Host "Project: $unityProjectDir"
Write-Host "Test mode: $TestMode"
Write-Host "QA temp root: $qaTempRoot"
Write-Host "QA save dir: $qaSaveDir"
Write-Host "Unity log: $unityLog"
Write-Host "Results: $resultXml"
Write-Host ""

# Verify Unity exists
if (-not (Test-Path $unityExe)) {
    Write-Error "Unity Editor not found at: $unityExe"
    Write-Host "Update `$unityExe in Run-QaTests.ps1 to match your installation."
    exit 1
}

# Verify project exists
if (-not (Test-Path $unityProjectDir)) {
    Write-Error "Unity project directory not found: $unityProjectDir"
    exit 1
}

# Build Unity command-line arguments
# -force-d3d11 is required: this machine's D3D12 path freezes the editor during
# PlayMode graphics setup, and -nographics prevents the TestRunner from starting
# at all in batch mode on this Unity version (editor exits -1 after domain reload).
$unityArgs = @(
    "-batchMode",
    "-force-d3d11",
    "-projectPath", $unityProjectDir,
    "-runTests",
    "-testResults", $resultXml,
    "-logFile", $unityLog
)

if ($TestMode -eq "EditMode") {
    $unityArgs += "-testPlatform", "EditMode"
}
else {
    # PlayMode tests run in the Editor (not on a built player)
    # Unity 6 Test Framework uses "PlayMode" for in-editor PlayMode tests
    $unityArgs += "-testPlatform", "PlayMode"
}

if (-not [string]::IsNullOrWhiteSpace($TestFilter)) {
    $unityArgs += "-testFilter", $TestFilter
}

Write-Host "Launching Unity with WW_SAVE_DIR=$qaSaveDir ..."
Write-Host ""

# Launch Unity with WW_SAVE_DIR set in the environment
# Use $env: variable directly instead of Start-Process -Environment (not supported in older PowerShell)
$originalWwSaveDir = $env:WW_SAVE_DIR
$env:WW_SAVE_DIR = $qaSaveDir

try {
    $process = Start-Process -FilePath $unityExe `
        -ArgumentList $unityArgs `
        -Wait `
        -NoNewWindow `
        -PassThru

    $exitCode = $process.ExitCode
}
finally {
    # Restore original environment variable
    if ($null -ne $originalWwSaveDir) {
        $env:WW_SAVE_DIR = $originalWwSaveDir
    }
    else {
        $env:WW_SAVE_DIR = $null
    }
}

Write-Host ""
Write-Host "Unity exited with code: $exitCode"

# Check for test results
$testsExecuted = $false
$testPassed = 0
$testFailed = 0
$testSkipped = 0
$testTotal = 0

if (Test-Path $resultXml) {
    Write-Host "Test results written to: $resultXml"
    
    # Parse test results from XML - support both legacy and modern Unity Test Framework schemas
    try {
        $xml = [xml](Get-Content $resultXml -Raw)
        
        # Modern Unity Test Framework uses <test-run> root element
        $testRun = $xml.SelectSingleNode("//test-run")
        if ($testRun -ne $null) {
            $testTotal = [int]$testRun.GetAttribute("total")
            $testPassed = [int]$testRun.GetAttribute("passed")
            $testFailed = [int]$testRun.GetAttribute("failed")
            $testSkipped = [int]$testRun.GetAttribute("skipped")
            $testsExecuted = ($testTotal -gt 0)
        }
        else {
            # Legacy schema fallback
            $testResults = $xml.SelectSingleNode("//test-results")
            if ($testResults -ne $null) {
                $testTotal = [int]$testResults.GetAttribute("total")
                $testPassed = [int]$testResults.GetAttribute("passed")
                $testFailed = [int]$testResults.GetAttribute("failures")
                $testsExecuted = ($testTotal -gt 0)
            }
        }
        
        if ($testsExecuted) {
            Write-Host "Tests executed: $testTotal total, $testPassed passed, $testFailed failed, $testSkipped skipped"
        }
        else {
            Write-Warning "Test results XML exists but no tests were discovered or executed."
        }
    }
    catch {
        Write-Warning "Could not parse test results XML: $_"
        Write-Host "Check the file manually: $resultXml"
    }
}
else {
    Write-Warning "Test results file not found. Tests may not have executed."
}

# Fail if tests didn't execute or had failures
if (-not $testsExecuted) {
    Write-Error "Tests did not execute! Exit code: $exitCode"
    Write-Host "Check Unity log for details: $unityLog"
}
elseif ($testFailed -gt 0) {
    Write-Error "$testFailed test(s) failed!"
}

# Verify SaveSystem used the QA directory
Write-Host ""
Write-Host "Verifying QA save isolation..."
$qaSaveFile = Join-Path $qaSaveDir "whispering_wilds_save.json"
if (Test-Path $qaSaveFile) {
    Write-Host "WARNING: QA save file exists after tests: $qaSaveFile"
    Write-Host "Tests may have left save files. This is expected if a save test ran."
}
else {
    Write-Host "OK: No QA save file left behind."
}

# Check Unity log for errors
Write-Host ""
Write-Host "Checking Unity log for errors..."
if (Test-Path $unityLog) {
    $errorLines = Select-String -Path $unityLog -Pattern "^\s*UnityEngine\.DebugLogHandler:LogError|error CS|Failed to" | Select-Object -First 20
    if ($errorLines) {
        Write-Host "Found errors/warnings in Unity log:"
        $errorLines | ForEach-Object { Write-Host "  $($_.Line)" }
    }
    else {
        Write-Host "OK: No obvious errors in Unity log."
    }
}

# Cleanup QA artifacts — preserve logs and results on failure
Write-Host ""
if ($testsExecuted -and $testFailed -eq 0 -and $exitCode -eq 0) {
    # Success: clean up all QA artifacts
    Write-Host "Tests passed. Cleaning up QA artifacts: $qaTempRoot"
    try {
        Remove-Item -Recurse -Force $qaTempRoot -ErrorAction SilentlyContinue
        Write-Host "OK: All QA artifacts cleaned up."
    }
    catch {
        Write-Warning "Could not clean up QA directory: $_"
    }
}
else {
    # Failure: preserve artifacts for inspection
    Write-Warning "Tests failed or did not execute. Preserving QA artifacts for inspection:"
    Write-Warning "  QA temp root: $qaTempRoot"
    Write-Warning "  Unity log: $unityLog"
    Write-Warning "  Test results: $resultXml"
}

Write-Host ""
Write-Host "========================================"
if ($testsExecuted -and $testFailed -eq 0 -and $exitCode -eq 0) {
    Write-Host "QA test run completed successfully."
    Write-Host "========================================"
    exit 0
}
else {
    Write-Host "QA test run FAILED."
    if (-not $testsExecuted) {
        Write-Host "  - Tests did not execute"
    }
    if ($testFailed -gt 0) {
        Write-Host "  - $testFailed test(s) failed"
    }
    if ($exitCode -ne 0) {
        Write-Host "  - Unity exit code: $exitCode"
    }
    Write-Host "========================================"
    exit 1
}
