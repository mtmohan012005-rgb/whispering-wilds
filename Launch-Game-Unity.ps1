param(
  [string]$BuildPath = "unity\Build\Windows\TheWhisperingWilds.exe"
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

Write-Host "Launching The Whispering Wilds: $targetExe" -ForegroundColor Green
Start-Process -FilePath $targetExe
