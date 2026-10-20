# Deterministic validation script for GitShaResolver failure and success paths
$unityExe = "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe"
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot "..\unity")).Path
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$actualSha = (git -C $repoRoot rev-parse HEAD).Trim().ToLower()

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Starting Deterministic GitShaResolver Validation Tests" -ForegroundColor Cyan
Write-Host "Authoritative Git HEAD: $actualSha" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

$allPassed = $true

function Run-ResolverCase {
    param (
        [string]$TestName,
        [string[]]$CustomArgs,
        [hashtable]$EnvVars,
        [int]$ExpectedExitCode
    )

    Write-Host "`n[TEST] $TestName..." -ForegroundColor Yellow

    # Setup environment variables
    $oldEnvs = @{}
    if ($EnvVars) {
        foreach ($k in $EnvVars.Keys) {
            $oldEnvs[$k] = [Environment]::GetEnvironmentVariable($k)
            [Environment]::SetEnvironmentVariable($k, $EnvVars[$k])
        }
    }

    $logFile = [System.IO.Path]::GetTempFileName()
    $baseArgs = @("-batchmode", "-quit", "-projectPath", $projectPath, "-executeMethod", "WhisperingWilds.Editor.QA.EditorCharacterRigAuditor.RunBatchAudit", "-logFile", $logFile, "-nographics")
    $finalArgs = if ($CustomArgs) { $baseArgs + $CustomArgs } else { $baseArgs }

    $proc = Start-Process -FilePath $unityExe -ArgumentList $finalArgs -Wait -PassThru
    $actualExitCode = $proc.ExitCode

    # Clean up environment variables
    if ($EnvVars) {
        foreach ($k in $EnvVars.Keys) {
            [Environment]::SetEnvironmentVariable($k, $oldEnvs[$k])
        }
    }

    $logTail = ""
    if (Test-Path $logFile) {
        $logTail = (Get-Content -Path $logFile -Tail 10) -join "`n"
        Remove-Item -Path $logFile -Force -ErrorAction SilentlyContinue
    }

    if ($actualExitCode -eq $ExpectedExitCode) {
        Write-Host "  ✅ PASS (ExitCode: $actualExitCode, Expected: $ExpectedExitCode)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ❌ FAIL (ExitCode: $actualExitCode, Expected: $ExpectedExitCode)" -ForegroundColor Red
        Write-Host "  Log output tail:`n$logTail" -ForegroundColor DarkGray
        return $false
    }
}

# Test Case 1: Valid Matching SHA override (Expected: 0)
$t1 = Run-ResolverCase -TestName "Matching CLI -gitSha argument" -CustomArgs @("-gitSha", $actualSha) -ExpectedExitCode 0
if (-not $t1) { $allPassed = $false }

# Test Case 2: Mismatched CLI SHA override (Expected: 1)
$t2 = Run-ResolverCase -TestName "Mismatched CLI -gitSha override (0000...)" -CustomArgs @("-gitSha", "0000000000000000000000000000000000000000") -ExpectedExitCode 1
if (-not $t2) { $allPassed = $false }

# Test Case 3: Malformed CLI SHA override (Expected: 1)
$t3 = Run-ResolverCase -TestName "Malformed CLI -gitSha override (short hex)" -CustomArgs @("-gitSha", "abc123") -ExpectedExitCode 1
if (-not $t3) { $allPassed = $false }

# Test Case 4: Mismatched Environment Variable override (Expected: 1)
$t4 = Run-ResolverCase -TestName "Mismatched WW_AUDIT_SHA environment variable" -EnvVars @{ "WW_AUDIT_SHA" = "1111111111111111111111111111111111111111" } -ExpectedExitCode 1
if (-not $t4) { $allPassed = $false }

# Test Case 5: Malformed Environment Variable override (Expected: 1)
$t5 = Run-ResolverCase -TestName "Malformed WW_AUDIT_SHA environment variable" -EnvVars @{ "WW_AUDIT_SHA" = "not-a-hex-sha" } -ExpectedExitCode 1
if (-not $t5) { $allPassed = $false }

Write-Host "`n============================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "ALL 5 DETERMINISTIC RESOLVER TEST CASES PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME RESOLVER TEST CASES FAILED!" -ForegroundColor Red
    exit 1
}
