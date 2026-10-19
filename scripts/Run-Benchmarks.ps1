param(
    [int]$BenchmarkDurationSeconds = 15,
    [string]$OutReport = "artifacts\qa\benchmark_report.json",
    [string]$LogFile = "artifacts\qa\benchmark_headless.log"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$unityExe = "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe"
$projectDir = Join-Path $repoRoot "unity"
$reportPath = Join-Path $repoRoot $OutReport
$logPath = Join-Path $repoRoot $LogFile

$outDir = Split-Path $reportPath -Parent
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$env:WW_BENCHMARK_SECONDS = "$BenchmarkDurationSeconds"

$unityArgs = @(
    "-batchMode",
    "-force-d3d11",
    "-projectPath", $projectDir,
    "-executeMethod", "WhisperingWilds.Editor.QA.RunHeadlessBenchmark.RunFromCommandLine",
    "-benchmarkScene", "Assets/_Project/Scenes/WW_Benchmark_Chennai.unity",
    "-benchmarkScene", "Assets/_Project/Scenes/WW_Benchmark_Pichavaram.unity",
    "-benchmarkScene", "Assets/_Project/Scenes/WW_Benchmark_Delta.unity",
    "-benchmarkScene", "Assets/_Project/Scenes/WW_Benchmark_Nilgiris.unity",
    "-benchmarkTimeout", "120",
    "-benchmarkOut", $reportPath,
    "-logFile", $logPath
)

Write-Host "=========================================="
Write-Host "Running 4 Whispering Wilds Benchmarks"
Write-Host "=========================================="
Write-Host "Unity: $unityExe"
Write-Host "Scenes: Chennai, Pichavaram, Delta, Nilgiris"
Write-Host "Report: $reportPath"
Write-Host "Log: $logPath"
Write-Host ""

$proc = Start-Process -FilePath $unityExe -ArgumentList $unityArgs -Wait -NoNewWindow -PassThru
Write-Host "Unity exited with code: $($proc.ExitCode)"

if (Test-Path $reportPath) {
    Write-Host "Benchmark report successfully generated at $reportPath"
    Get-Content $reportPath
} else {
    Write-Warning "Benchmark report not found at $reportPath. Check log at $logPath"
}
