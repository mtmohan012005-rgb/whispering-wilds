@echo off
title The Whispering Wilds - PC Launcher
color 0A

echo ========================================================
echo   THE WHISPERING WILDS (KAATTU VAZHI)
echo   Standalone PC and Laptop Game Launcher
echo ========================================================
echo.

cd /d "%~dp0"

:: Start local HTTP server in background if not already running
echo Checking local game server on port 8080...
powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:8080' -UseBasicParsing -TimeoutSec 1).StatusCode } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting lightweight background game server...
    start /b powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File serve.ps1
    timeout /t 2 /nobreak >nul
) else (
    echo Game server is already active!
)

:: Find preferred browser for standalone PC app window
set EDGE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist %EDGE% set EDGE="C:\Program Files\Microsoft\Edge\Application\msedge.exe"
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

echo Launching dedicated PC application window...
if exist %EDGE% (
    start "" %EDGE% --app="http://localhost:8080" --window-size=1920,1080 --start-maximized --disable-features=TranslateUI --ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy
    goto DONE
)

if exist %CHROME% (
    start "" %CHROME% --app="http://localhost:8080" --window-size=1920,1080 --start-maximized --ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy
    goto DONE
)

:: Fallback default browser
start http://localhost:8080

:DONE
echo.
echo Game launched successfully! Enjoy your journey through Tamil Nadu.
timeout /t 3 /nobreak >nul
exit
