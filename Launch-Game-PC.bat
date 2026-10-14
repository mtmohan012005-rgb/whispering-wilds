@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Launch-Game-PC.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo Game launch failed or executable was not found.
    echo Please see docs\LOCAL_SETUP.md for build instructions.
    pause
)
