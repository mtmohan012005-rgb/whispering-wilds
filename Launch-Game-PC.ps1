<#
.SYNOPSIS
    The Whispering Wilds (Kaattu Vazhi) - PC Launcher
.DESCRIPTION
    Delegates to the authoritative native Unity 6 executable launcher (Launch-Game-Unity.ps1).
    Legacy browser testing is available via Launch-Legacy-Web-Game.ps1.
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $scriptDir "Launch-Game-Unity.ps1")
