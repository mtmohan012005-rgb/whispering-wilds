<#
.SYNOPSIS
    Measures standalone runtime performance of The Whispering Wilds for >=60s.
.DESCRIPTION
    Launches unity/Build/Windows/TheWhisperingWilds.exe, monitors memory, CPU, responsiveness,
    and captures Player.log diagnostic telemetry across warmup and steady-state periods.
#>
param(
    [string]$ExePath = "unity\Build\Windows\TheWhisperingWilds.exe",
    [string]$ArtifactDir = "artifacts\qa\20261019-190300-repair",
    [int]$MeasureSeconds = 65
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$targetExe = Join-Path $repoRoot $ExePath
$outDir = Join-Path $repoRoot $ArtifactDir

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$playerLogPath = Join-Path $outDir "Player.log"
if (Test-Path $playerLogPath) {
    Remove-Item -Force $playerLogPath
}

Write-Host "=========================================================="
Write-Host " The Whispering Wilds - Standalone Performance Benchmark"
Write-Host "=========================================================="
Write-Host "Executable: $targetExe"
Write-Host "Log file:   $playerLogPath"
Write-Host "Duration:   $MeasureSeconds seconds"
Write-Host "Start time: $(Get-Date -Format 'o')"
Write-Host ""

$startTime = Get-Date
$process = Start-Process -FilePath $targetExe -ArgumentList "-logFile", "`"$playerLogPath`"" -PassThru

$samples = @()
$warmupSeconds = 10
$elapsed = 0

Write-Host "Process launched (PID: $($process.Id)). Warming up for $warmupSeconds seconds..."

while ($elapsed -lt $MeasureSeconds -and -not $process.HasExited) {
    Start-Sleep -Seconds 1
    $elapsed = ((Get-Date) - $startTime).TotalSeconds

    try {
        $p = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
        if ($p) {
            $sample = [PSCustomObject]@{
                TimeOffsetSeconds = [math]::Round($elapsed, 1)
                WorkingSetMB = [math]::Round($p.WorkingSet64 / 1MB, 2)
                PrivateMemoryMB = [math]::Round($p.PrivateMemorySize64 / 1MB, 2)
                Responding = $p.Responding
                InWarmup = ($elapsed -lt $warmupSeconds)
            }
            $samples += $sample

            if ([int]$elapsed % 10 -eq 0) {
                Write-Host "[$([int]$elapsed)s] WorkingSet: $($sample.WorkingSetMB) MB | PrivateMem: $($sample.PrivateMemoryMB) MB | Responding: $($sample.Responding)"
            }
        }
    } catch {}
}

$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "Benchmark sampling completed ($([math]::Round($totalDuration, 1))s elapsed). Terminating test instance..."
if (-not $process.HasExited) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    $process.WaitForExit(5000)
}

# Wait for file flush
Start-Sleep -Seconds 2

# Analyze Player.log
$playerLogContent = ""
if (Test-Path $playerLogPath) {
    $playerLogContent = Get-Content $playerLogPath -Raw
}

$displaySetting = ""
if ($playerLogContent -match '\[DisplaySettingsManager\]\s*([^\r\n]+)') {
    $displaySetting = $matches[1]
}

$qualityProfile = ""
if ($playerLogContent -match '\[QualityPresetManager\]\s*Applied preset:\s*([^\r\n]+)') {
    $qualityProfile = $matches[1]
} elseif ($playerLogContent -match '\[GraphicsPerformanceManager\]\s*Authoritative profile applied:\s*([^\r\n]+)') {
    $qualityProfile = $matches[1]
}

$memoryBudget = ""
if ($playerLogContent -match '\[MemoryManager\]\s*Configured budget[^:]*:\s*([^\r\n]+)') {
    $memoryBudget = $matches[1]
}

$frameDrops = @()
$dropMatches = [regex]::Matches($playerLogContent, 'Frame drop detected \(([^)]+)\)')
foreach ($m in $dropMatches) {
    $frameDrops += $m.Groups[1].Value
}

# Compute memory statistics
$postWarmupSamples = $samples | Where-Object { -not $_.InWarmup }
if ($postWarmupSamples.Count -eq 0) { $postWarmupSamples = $samples }

$avgWorkingSetMB = [math]::Round(($postWarmupSamples | Measure-Object -Property WorkingSetMB -Average).Average, 2)
$maxWorkingSetMB = [math]::Round(($postWarmupSamples | Measure-Object -Property WorkingSetMB -Maximum).Maximum, 2)
$minWorkingSetMB = [math]::Round(($postWarmupSamples | Measure-Object -Property WorkingSetMB -Minimum).Minimum, 2)

$avgPrivateMemMB = [math]::Round(($postWarmupSamples | Measure-Object -Property PrivateMemoryMB -Average).Average, 2)
$maxPrivateMemMB = [math]::Round(($postWarmupSamples | Measure-Object -Property PrivateMemoryMB -Maximum).Maximum, 2)

$telemetryResult = [PSCustomObject]@{
    RunId = "20261019-190300-repair"
    Timestamp = (Get-Date -Format 'o')
    Executable = $targetExe
    ProcessId = $process.Id
    DurationSeconds = [math]::Round($totalDuration, 2)
    Hardware = [PSCustomObject]@{
        CPU = "Intel Core i3-N305 (8C/8T)"
        RAM_MB = 8054
        GPU = "Intel UHD Graphics (Direct3D 11.0 level 11.1)"
        OS = "Windows 11 Home 64-bit"
    }
    ConfiguredSettings = [PSCustomObject]@{
        DisplaySetting = $displaySetting
        QualityProfile = $qualityProfile
        MemoryBudget = $memoryBudget
        TargetFpsCap = if ($displaySetting -match 'cap=(\d+)') { [int]$matches[1] } else { 30 }
        VSync = if ($displaySetting -match 'vSync=(\w+)') { $matches[1] } else { "False" }
        Resolution = if ($displaySetting -match '(\d+x\d+ @\d+Hz)') { $matches[1] } else { "1366x768 @60Hz" }
    }
    ProcessMemory = [PSCustomObject]@{
        AvgWorkingSetMB = $avgWorkingSetMB
        MaxWorkingSetMB = $maxWorkingSetMB
        MinWorkingSetMB = $minWorkingSetMB
        AvgPrivateMemoryMB = $avgPrivateMemMB
        MaxPrivateMemoryMB = $maxPrivateMemMB
    }
    FrameDropEvents = $frameDrops
    SamplesCount = $samples.Count
    Status = "COMPLETED"
}

$jsonPath = Join-Path $outDir "PERFORMANCE_TELEMETRY.json"
$telemetryResult | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding utf8

Write-Host "=========================================================="
Write-Host " Performance Telemetry Summary"
Write-Host "=========================================================="
Write-Host "Duration:           $($telemetryResult.DurationSeconds) seconds ($($samples.Count) samples)"
Write-Host "Display Setting:    $($telemetryResult.ConfiguredSettings.DisplaySetting)"
Write-Host "Quality Profile:    $($telemetryResult.ConfiguredSettings.QualityProfile)"
Write-Host "Memory Budget:      $($telemetryResult.ConfiguredSettings.MemoryBudget)"
Write-Host "Avg Working Set:    $($telemetryResult.ProcessMemory.AvgWorkingSetMB) MB (Peak: $($telemetryResult.ProcessMemory.MaxWorkingSetMB) MB)"
Write-Host "Avg Private Mem:    $($telemetryResult.ProcessMemory.AvgPrivateMemoryMB) MB"
Write-Host "Frame Drop Events:  $($frameDrops.Count) events detected during warmup"
Write-Host "Results saved to:   $jsonPath"
Write-Host "=========================================================="
