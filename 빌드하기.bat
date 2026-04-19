@echo off
chcp 65001 >nul
title Godot 배포 도우미 - Windows 빌드

echo.
echo  ================================
echo   Windows 설치 파일 빌드 시작
echo  ================================
echo.

:: node_modules 없으면 자동 설치
if not exist "node_modules" (
    echo  패키지 설치 중... 잠시만 기다려 주세요.
    echo.
    npm install
    if errorlevel 1 (
        echo.
        echo  [오류] 패키지 설치에 실패했습니다.
        pause
        exit /b 1
    )
)

echo  빌드 중입니다... 수 분이 걸릴 수 있습니다.
echo.
npm run dist:win

if errorlevel 1 (
    echo.
    echo  [오류] 빌드에 실패했습니다.
    pause
    exit /b 1
)

echo.
echo  ================================
echo   빌드 완료!
echo   결과물 위치: release 폴더
echo  ================================
echo.
explorer release
pause
