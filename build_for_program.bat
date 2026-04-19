@echo off
title Build - Godot Deployer

echo.
echo  ================================
echo   Build Start (Windows)
echo  ================================
echo.

:: Check Node.js
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo.
    echo  Please install Node.js from the link below and try again.
    echo  https://nodejs.org
    echo.
    start https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  Installing packages...
    npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
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
