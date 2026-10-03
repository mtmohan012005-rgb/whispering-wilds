param(
  [string]$BuildPath = "Build\Windows\TheWhisperingWilds.exe"
)
$exe = Join-Path $PSScriptRoot $BuildPath
if (-not (Test-Path $exe)) {
  Write-Error "Executable not found at $exe"
  exit 1
}
Start-Process -FilePath $exe
