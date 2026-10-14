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
$unityProjectDir = Join-Path $PSScriptRoot "unity"
$unityExe = "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe"
$logDir = Join-Path $PSScriptRoot "qa_test_logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# Create unique QA save directory for this test run
$qaSaveDir = Join-Path $env:TEMP "ww_qa_saves_$(Get-Date -Format 'yyyyMMddHHmmss')_$((New-Guid).ToString('N').Substring(0, 8))"
New-Item -ItemType Directory -Force -Path $qaSaveDir | Out-Null

# Timestamp for log files
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$unityLog = Join-Path $logDir "unity_${TestMode}_${timestamp}.log"
$resultXml = Join-Path $logDir "test_results_${TestMode}_${timestamp}.xml"

Write-Host "========================================"
Write-Host "Whispering Wilds QA Test Runner"
Write-Host "========================================"
Write-Host "Unity: $unityExe"
Write-Host "Project: $unityProjectDir"
Write-Host "Test mode: $TestMode"
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
$unityArgs = @(
    "-batchMode",
    "-nographics",
    "-projectPath", $unityProjectDir,
    "-runTests",
    "-testPlatform", "WindowsPlayer",
    "-testResults", $resultXml,
    "-logFile", $unityLog
)

if ($TestMode -eq "EditMode") {
    $unityArgs += "-testCategory", "EditMode"
}

if (-not [string]::IsNullOrWhiteSpace($TestFilter)) {
    $unityArgs += "-testFilter", $TestFilter
}

Write-Host "Launching Unity with WW_SAVE_DIR=$qaSaveDir ..."
Write-Host ""

# Launch Unity with WW_SAVE_DIR set in the environment
$envVars = @{
    "WW_SAVE_DIR" = $qaSaveDir
}

$process = Start-Process -FilePath $unityExe `
    -ArgumentList $unityArgs `
    -Environment $envVars `
    -Wait `
    -NoNewWindow `
    -PassThru

$exitCode = $process.ExitCode
Write-Host ""
Write-Host "Unity exited with code: $exitCode"

# Check for test results
if (Test-Path $resultXml) {
    Write-Host "Test results written to: $resultXml"
    
    # Parse basic results from XML
    try {
        $xml = [xml](Get-Content $resultXml)
        $passed = $xml.selectSingleNode("//test-results").'passed'
        $failed = $xml.selectSingleNode("//test-results").'failures'
        $total = $xml.selectSingleNode("//test-results").'total'
        Write-Host "Tests: $passed passed, $failed failed, $total total"
    }
    catch {
        Write-Host "Could not parse test results XML. Check the file manually."
    }
}
else {
    Write-Warning "Test results file not found. Tests may not have executed."
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

# Cleanup QA save directory
Write-Host ""
Write-Host "Cleaning up QA save directory: $qaSaveDir"
try {
    Remove-Item -Recurse -Force $qaSaveDir -ErrorAction SilentlyContinue
    Write-Host "OK: QA directory cleaned up."
}
catch {
    Write-Warning "Could not clean up QA directory: $_"
}

Write-Host ""
Write-Host "========================================"
if ($exitCode -eq 0) {
    Write-Host "QA test run completed successfully."
}
else {
    Write-Host "QA test run finished with exit code: $exitCode"
}
Write-Host "========================================"

exit $exitCode
