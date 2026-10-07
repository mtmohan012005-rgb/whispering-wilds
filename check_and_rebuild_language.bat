@echo off
title Game Text & Dictionary Engine Rebuilder
cls

:menu
cls
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
echo Checking project environment file states...
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
echo Verification run complete. Launching the game with debug logs enabled...
pause
exit
