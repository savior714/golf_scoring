@chcp 65001 > nul
@echo off
:: Golf Tracker Development Launcher
:: This script calls the modernized PowerShell version

pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Golf Tracker] Error occurred during startup.
    pause
)
