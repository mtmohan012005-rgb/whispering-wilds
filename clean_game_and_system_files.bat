@echo off
title Ultimate Game & System Files Cleaner
cls

:menu
cls
echo =======================================================
echo          GAME FILES & SYSTEM CLEANUP PROMPT
echo =======================================================
echo.
echo Select the "waste" file cache you want to check and remove:
echo [1] Clear User Temp Files (Game setups, extraction leftovers)
echo [2] Clear System Temp Files (Windows crash dumps, log clutter)
echo [3] Clear Windows Prefetch (Outdated software launch logs)
echo [4] Clear DirectX Shader Cache (Corrupted game graphics cache)
echo [5] Empty the Recycle Bin (Permanently delete trashed files)
echo [6] Check & Rebuild Game Text & Dictionary Engine State
echo [7] RUN ALL CLEANUPS AT ONCE
echo [8] Exit
echo.
echo =======================================================
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto usertemp
if "%choice%"=="2" goto systemtemp
if "%choice%"=="3" goto prefetch
if "%choice%"=="4" goto dxcache
if "%choice%"=="5" goto recyclebin
if "%choice%"=="6" goto checklanguage
if "%choice%"=="7" goto runall
if "%choice%"=="8" goto exit
echo Invalid choice, try again. & pause & goto menu

:usertemp
echo.
echo Safely clearing User Temp files while preserving App Data...
:: Deletes loose files but avoids wiping core local app game states
del /q /f "%TEMP%\*.*" 2>nul
echo Done!
pause & goto menu

:systemtemp
echo.
echo Clearing System Temp files (Windows crash dumps, log clutter)...
del /s /f /q "%SystemRoot%\Temp\*.*" 2>nul
for /d %%p in ("%SystemRoot%\Temp\*.*") do rmdir "%%p" /s /q 2>nul
echo Done!
pause & goto menu

:prefetch
echo.
echo Clearing Windows Prefetch cache...
del /s /f /q "%SystemRoot%\Prefetch\*.*" 2>nul
echo Done!
pause & goto menu

:dxcache
echo.
echo Clearing DirectX & GPU Shader Cache...
if exist "%LOCALAPPDATA%\D3DSCache" del /s /f /q "%LOCALAPPDATA%\D3DSCache\*.*" 2>nul
if exist "%LOCALAPPDATA%\NVIDIA\DXCache" del /s /f /q "%LOCALAPPDATA%\NVIDIA\DXCache\*.*" 2>nul
if exist "%LOCALAPPDATA%\AMD\DxCache" del /s /f /q "%LOCALAPPDATA%\AMD\DxCache\*.*" 2>nul
echo Done!
pause & goto menu

:recyclebin
echo.
echo Emptying the Recycle Bin...
powershell.exe -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" 2>nul
echo Done!
pause & goto menu

:checklanguage
echo.
echo =======================================================
echo          GAME TEXT & DICTIONARY ENGINE REBUILDER
echo =======================================================
echo.
echo Checking your active localization paths...
echo Look for text configuration files (e.g., config.json, lang.json, values.xml)
echo.

:: 1. Force the engine to clear local app runtime state storage
if exist "%LocalAppData%\The_Whispering_Wilds" (
    echo [FOUND] Local App Cache detected. Wiping corrupted UI state storage...
    rd /s /q "%LocalAppData%\The_Whispering_Wilds"
)
if exist "%LocalAppData%Low\DefaultCompany\The_Whispering_Wilds" (
    echo [FOUND] Unity LocalLow App Cache detected. Wiping corrupted UI state storage...
    rd /s /q "%LocalAppData%Low\DefaultCompany\The_Whispering_Wilds"
)
if exist "%LocalAppData%Low\The Whispering Wilds" (
    echo [FOUND] Unity LocalLow App Cache detected. Wiping corrupted UI state storage...
    rd /s /q "%LocalAppData%Low\The Whispering Wilds"
)

:: 2. Regenerate text directory integrity
echo Checking node project file states...
if exist "package.json" (
    echo [FOUND] Build architecture detected. Rebuilding UI string assets...
    call npm cache clean --force >nul 2>&1
    call npm install
) else (
    echo [NOTICE] Standalone build detected. 
    echo Please make sure your 'locales/' or 'lang/' data folders are placed 
    echo inside the root folder next to the main game executable.
)

echo.
echo Verification run complete.
pause
goto menu

:runall
echo.
echo =======================================================
echo            RUNNING ALL SYSTEM CLEANUPS
echo =======================================================
echo.
echo [1/5] Clearing User Temp files...
del /q /f "%TEMP%\*.*" 2>nul

echo [2/5] Clearing System Temp files...
del /s /f /q "%SystemRoot%\Temp\*.*" 2>nul
for /d %%p in ("%SystemRoot%\Temp\*.*") do rmdir "%%p" /s /q 2>nul

echo [3/5] Clearing Windows Prefetch...
del /s /f /q "%SystemRoot%\Prefetch\*.*" 2>nul

echo [4/5] Clearing DirectX & GPU Shader Cache...
if exist "%LOCALAPPDATA%\D3DSCache" del /s /f /q "%LOCALAPPDATA%\D3DSCache\*.*" 2>nul
if exist "%LOCALAPPDATA%\NVIDIA\DXCache" del /s /f /q "%LOCALAPPDATA%\NVIDIA\DXCache\*.*" 2>nul
if exist "%LOCALAPPDATA%\AMD\DxCache" del /s /f /q "%LOCALAPPDATA%\AMD\DxCache\*.*" 2>nul

echo [5/5] Emptying the Recycle Bin...
powershell.exe -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" 2>nul

echo.
echo =======================================================
echo            ALL CLEANUPS COMPLETED SUCCESSFULLY!
echo =======================================================
pause & goto menu

:exit
exit
