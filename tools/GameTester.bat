@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Game Installation & Performance Tester
cd /d "%~dp0"

rem Default game executable (override in the menu or drop your own path).
set "DEFAULT_GAME=C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds\TheWhisperingWilds_Windows_x64_RC\TheWhisperingWilds.exe"

cls
echo.
echo ============================================
echo     GAME INSTALLATION AND PERFORMANCE TESTER
echo ============================================
echo.

:menu
cls
echo =======================================================
echo          GAME INSTALLATION & PERFORMANCE TESTER
echo =======================================================
echo.
echo 1. Install a Game (Run Setup file)
echo 2. Run a Game Test (Launch a game executable)
echo 3. Run System Health Test (Before playing)
echo 4. Monitor Live Performance (While game is running)
echo 5. Clear User Temp Files (Safely)
echo 6. Return to Main Menu / Exit
echo.
echo =======================================================
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto runtest
if "%choice%"=="3" goto health
if "%choice%"=="4" goto monitor
if "%choice%"=="5" goto usertemp
if "%choice%"=="6" goto exit
echo Invalid choice, try again. & pause & goto menu

:install
echo.
echo =======================================================
echo                 GAME INSTALLATION MODE
echo =======================================================
echo Drag and drop your game installer (.exe or .msi) here,
echo or type the exact path to the setup file, then press ENTER:
echo.
set /p setup_path="Installer Path: "
:: Remove quotes if user dragged and dropped the file
set "setup_path=%setup_path:"=%"

if not exist "%setup_path%" (
    echo [ERROR] File not found! Please check the path.
    pause & goto menu
)

echo Launching installer: %setup_path%
echo Waiting for installation to finish...
start /wait "" "%setup_path%"
echo.
echo Installation process closed.
pause & goto menu

:runtest
echo.
echo =======================================================
echo                   GAME RUNNING TEST
echo =======================================================
set /p "game_path=Game Executable Path (ENTER = default): "
set "game_path=%game_path:"=%"
if "%game_path%"=="" set "game_path=%DEFAULT_GAME%"

if not exist "%game_path%" (
    echo [ERROR] Game file not found: %game_path%
    pause & goto menu
)

echo Launching game test...
echo The script will track how long you test the game.
echo.
:: Elapsed time in seconds, computed by PowerShell so midnight roll-over is handled.
for /f %%t in ('powershell -NoProfile -Command "[int][double]::Parse((Get-Date -UFormat %%s))"') do set "start_epoch=%%t"
set "start_txt=%time%"
start "" "%game_path%"
echo Game is running (PID window is open now). Press any key in this prompt AFTER you close the game.
pause >nul
for /f %%t in ('powershell -NoProfile -Command "[int][double]::Parse((Get-Date -UFormat %%s))"') do set "end_epoch=%%t"
set /a elapsed=end_epoch-start_epoch
set /a minutes=elapsed/60
set /a seconds=elapsed%%60
echo Test finished. Started at !start_txt! - ran %minutes%m %seconds%s.
pause & goto menu

:health
echo.
echo =======================================================
echo                 PRE-GAME SYSTEM HEALTH
echo =======================================================
echo Opening DirectX Diagnostics...
start dxdiag /whql:off
echo Verifying system files (read-only check, no repair)...
sfc /verifyonly
echo.
echo Check completed. If dxdiag opened, your DirectX info is available.
pause & goto menu

:monitor
echo.
echo =======================================================
echo                LIVE PERFORMANCE MONITOR
echo =======================================================
echo Keeping this window open will show live CPU and RAM usage.
echo Press Ctrl + C to stop monitoring.
echo.
set /p "mon_target=Game .exe filename to watch (ENTER = TheWhisperingWilds.exe, * = everything): "
if "%mon_target%"=="" set "mon_target=TheWhisperingWilds"
if "%mon_target%"=="*" set "mon_target=*"
echo.
echo Watching: %mon_target%
echo.
:loop
cls
echo Press Ctrl + C to exit monitor loop.
echo ----------------------------------------------------
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p = Get-Process -Name '%mon_target%' -ErrorAction SilentlyContinue; " ^
  "if ($p) { $mb = [math]::Round(($p.WorkingSet64 / 1MB), 1); " ^
  "  'Game process: {0} PID(s): {1}', $p.ProcessName, ($p.Id -join ', '); " ^
  "  'Game memory : ' + ($mb -join ' + ') + ' MB'; " ^
  "  'Game CPU    : ' + ([math]::Round(($p.CPU / ([Environment]::ProcessorCount)) * 10, 1)) + ' %%' } else { 'Game process not running.' };" ^
  "$cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average; " ^
  "$os = Get-CimInstance Win32_OperatingSystem; " ^
  "$tot = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1); " ^
  "$free = [math]::Round($os.FreePhysicalMemory / 1MB, 1); " ^
  "'System CPU : ' + $cpu + ' %%'; " ^
  "'System RAM : ' + $free + ' GB free / ' + $tot + ' GB total'"
echo.
timeout /t 3 /nobreak >nul
goto loop

:usertemp
echo.
echo Safely clearing User Temp files while preserving App Data...
:: Deletes loose files but avoids wiping core local app game states
del /q /f "%TEMP%\*.*" 2>nul
echo Done!
pause & goto menu

:exit
endlocal
exit /b 0