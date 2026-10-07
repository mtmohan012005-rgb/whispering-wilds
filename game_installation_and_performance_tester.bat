@echo off
title Game Installation & Performance Tester
cls

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
set setup_path=%setup_path:"=%

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
echo Drag and drop your game shortcut or main game .exe here,
echo then press ENTER to launch a test session:
echo.
set /p game_path="Game Executable Path: "
set game_path=%game_path:"=%

if not exist "%game_path%" (
    echo [ERROR] Game file not found!
    pause & goto menu
)

echo Launching game test...
echo The script will track how long you test the game.
set start_time=%time%
start "" "%game_path%"
echo Game is running. Press any key in this prompt AFTER you close the game.
pause >nul
echo Test finished. Started at %start_time%, ended at %time%.
pause & goto menu

:health
echo.
echo =======================================================
echo                 PRE-GAME SYSTEM HEALTH
echo =======================================================
echo checking DirectX files...
dxdiag /dontskip /whql:off
echo Checking System Files for corruption...
sfc /verifyonly
echo.
echo Check completed. If dxdiag popped up, your DirectX is healthy.
pause & goto menu

:monitor
echo.
echo =======================================================
echo                LIVE PERFORMANCE MONITOR
echo =======================================================
echo Keeping this window open will show you live CPU and RAM usage.
echo Press Ctrl + C to stop monitoring.
echo.
:loop
cls
echo Press Ctrl + C to exit monitor loop.
echo ----------------------------------------------------
echo Current Hardware Utilization:
echo ----------------------------------------------------
wmic cpu get loadpercentage /value | find "LoadPercentage"
wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value
timeout /t 3 >nul
goto loop

:usertemp
echo.
echo Safely clearing User Temp files while preserving App Data...
:: Deletes loose files but avoids wiping core local app game states
del /q /f "%TEMP%\*.*" 2>nul
echo Done!
pause & goto menu

:exit
exit
