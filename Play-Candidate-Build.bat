@echo off
setlocal
cd /d "%~dp0"
echo ==============================================================
echo  The Whispering Wilds - Candidate Release 5056deb Launcher
echo ==============================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\launch-candidate-playtest.ps1" -SkipExtract
if %ERRORLEVEL% neq 0 (
    echo.
    echo Candidate launch or extraction encountered an error.
    pause
)
