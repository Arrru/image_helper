@echo off
title Build - Godot Deployer

echo.
echo  ================================
echo   Build Start (Windows)
echo  ================================
echo.

:: Check Node.js, auto-install if missing
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo  Node.js not found. Installing automatically...
    echo  Please wait a moment.
    echo.
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo  [ERROR] Auto-install failed.
        echo  Please install Node.js manually: https://nodejs.org
        start https://nodejs.org
        pause
        exit /b 1
    )
    echo  Node.js installed. Restarting script...
    echo.
    :: Refresh PATH and restart
    call refreshenv >nul 2>&1
    start "" "%~f0"
    exit /b 0
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
