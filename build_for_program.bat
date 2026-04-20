@echo off
setlocal EnableDelayedExpansion
title Build - Godot Deployer

echo.
echo  ================================
echo   Build Start (Windows)
echo  ================================
echo.

:: Add common Node.js install paths in case PATH is not updated yet
for %%d in (
    "%ProgramFiles%\nodejs"
    "%ProgramFiles(x86)%\nodejs"
    "%LOCALAPPDATA%\Programs\nodejs"
) do (
    if exist "%%~d\npm.cmd" set "PATH=%%~d;!PATH!"
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo  Node.js not found. Installing automatically...
    echo.
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if !errorlevel! neq 0 (
        echo.
        echo  [ERROR] winget failed. Please install Node.js manually from https://nodejs.org
        pause
        exit /b 1
    )
    echo.
    :: Add install paths again after winget finishes
    for %%d in (
        "%ProgramFiles%\nodejs"
        "%ProgramFiles(x86)%\nodejs"
        "%LOCALAPPDATA%\Programs\nodejs"
    ) do (
        if exist "%%~d\npm.cmd" set "PATH=%%~d;!PATH!"
    )
    where npm >nul 2>&1
    if !errorlevel! neq 0 (
        echo  ================================
        echo   Node.js installed!
        echo   Please close and run again.
        echo  ================================
        echo.
        pause
        exit /b 0
    )
    echo  Node.js is ready. Continuing...
    echo.
)

if not exist "node_modules" (
    echo  Installing packages...
    npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo.
)

echo  Building... This may take a few minutes.
echo.
npm run dist:win

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo  ================================
echo   Build complete! Check: release/
echo  ================================
echo.
explorer release
pause
