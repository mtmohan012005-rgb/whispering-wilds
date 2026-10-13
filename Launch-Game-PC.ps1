<#
.SYNOPSIS
    The Whispering Wilds (Kaattu Vazhi) - PC Launcher
.DESCRIPTION
    Launches the native Unity 6 standalone executable.
    The executable must be built first (see docs/LOCAL_SETUP.md).
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $scriptDir "Launch-Game-Unity.ps1")
