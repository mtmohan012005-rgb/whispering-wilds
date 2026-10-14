param(
  [string]$BuildPath = "unity\Build\Windows\TheWhisperingWilds.exe",
  [switch]$Diagnostic
)

# Resolve canonical executable path
$candidatePaths = @(
  (Join-Path $PSScriptRoot $BuildPath),
  (Join-Path $PSScriptRoot "Build\Windows\TheWhisperingWilds.exe"),
  (Join-Path (Join-Path $PSScriptRoot "unity") "Build\Windows\TheWhisperingWilds.exe")
)

$targetExe = $null
foreach ($path in $candidatePaths) {
  if (Test-Path $path) {
    $targetExe = (Resolve-Path $path).Path
    break
  }
}

if (-not $targetExe) {
  Write-Host "==========================================================" -ForegroundColor Red
  Write-Host " The Whispering Wilds (காட்டு வழி • தடம்) - Build Required" -ForegroundColor Yellow
  Write-Host "==========================================================" -ForegroundColor Red
  Write-Host "Executable not found at: $(Join-Path $PSScriptRoot $BuildPath)" -ForegroundColor White
  Write-Host ""
  Write-Host "A native Unity 6 standalone build is required to play the game." -ForegroundColor White
  Write-Host "The legacy browser implementation has been removed." -ForegroundColor White
  Write-Host ""
  Write-Host "To build the game:" -ForegroundColor Cyan
  Write-Host "  1. Open the project in Unity 6000.6.3f1 (project folder: 'unity/')" -ForegroundColor Gray
  Write-Host "  2. Run: Tools -> Whispering Wilds -> Build Production Windows x64" -ForegroundColor Gray
  Write-Host "  3. Or run the headless build command (see docs/LOCAL_SETUP.md)" -ForegroundColor Gray
  Write-Host "==========================================================" -ForegroundColor Red
  exit 1
}

if ($Diagnostic) {
  # Diagnostic mode: capture logs, exit code, and process lifetime
  $logDir = Join-Path $PSScriptRoot "unity\Build\Windows"
  $logFile = Join-Path $logDir "Player_Diagnostic.log"
  $launchTime = Get-Date

  Write-Host "==========================================================" -ForegroundColor Cyan
  Write-Host " The Whispering Wilds - Diagnostic Launch" -ForegroundColor Cyan
  Write-Host "==========================================================" -ForegroundColor Cyan
  Write-Host "Executable: $targetExe" -ForegroundColor White
  Write-Host "Log file:   $logFile" -ForegroundColor White
  Write-Host "Launch time: $launchTime" -ForegroundColor White
  Write-Host ""

  # Launch with explicit log file
  $process = Start-Process -FilePath $targetExe -ArgumentList "-logFile", $logFile -PassThru
  Write-Host "Process ID: $($process.Id)" -ForegroundColor White
  Write-Host "Waiting for game to exit..." -ForegroundColor Yellow

  $process.WaitForExit()
  $exitTime = Get-Date
  $elapsed = ($exitTime - $launchTime).TotalSeconds

  Write-Host ""
  Write-Host "==========================================================" -ForegroundColor Cyan
  Write-Host " Game exited" -ForegroundColor Cyan
  Write-Host "==========================================================" -ForegroundColor Cyan
  Write-Host "Exit code:   $($process.ExitCode)" -ForegroundColor White
  Write-Host "Elapsed:     $([math]::Round($elapsed, 1)) seconds" -ForegroundColor White
  Write-Host "Log file:    $logFile" -ForegroundColor White
  Write-Host ""

  if ($elapsed -lt 5) {
    Write-Host "WARNING: Game exited very quickly ($([math]::Round($elapsed, 1))s). This likely indicates a crash." -ForegroundColor Red
    Write-Host ""
  }

  # Show last lines of log if it exists
  if (Test-Path $logFile) {
    $logContent = Get-Content $logFile
    $lineCount = $logContent.Count
    Write-Host "Player log: $lineCount lines" -ForegroundColor White
    Write-Host ""

    # Show errors and warnings
    $errors = $logContent | Select-String "ERROR|Exception|Fatal|NullReference|Failed"
    if ($errors.Count -gt 0) {
      Write-Host "=== ERRORS/EXCEPTIONS FOUND ($($errors.Count)) ===" -ForegroundColor Red
      $errors | Select-Object -Last 20 | ForEach-Object { Write-Host $_.Line -ForegroundColor Red }
      Write-Host ""
    }

    # Show last 30 lines
    Write-Host "=== LAST 30 LINES OF PLAYER LOG ===" -ForegroundColor Yellow
    $logContent | Select-Object -Last 30 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
  }
  else {
    Write-Host "WARNING: Player log not found at $logFile" -ForegroundColor Red
  }
}
else {
  # Normal mode: launch and detach
  Write-Host "Launching The Whispering Wilds: $targetExe" -ForegroundColor Green
  Start-Process -FilePath $targetExe
}
