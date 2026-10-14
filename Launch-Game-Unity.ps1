param(
  [string]$BuildPath = "unity\Build\Windows\TheWhisperingWilds.exe"
)
$exe = Join-Path $PSScriptRoot $BuildPath
if (-not (Test-Path $exe)) {
  Write-Error "Executable not found at `$exe`n`nBuild the game in Unity 6 first (see docs/LOCAL_SETUP.md)."
  exit 1
}
Start-Process -FilePath $exe
