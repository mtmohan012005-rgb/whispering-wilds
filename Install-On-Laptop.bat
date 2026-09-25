@echo off
title Install The Whispering Wilds
color 0B
echo Installing The Whispering Wilds on your laptop...
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0Install-On-Laptop.ps1"
pause
