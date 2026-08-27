@echo off
title Khmer Caption Studio Desktop
cd /d "%~dp0"

echo ==================================================
echo 🎬 Starting Khmer Caption Studio Desktop App...
echo ==================================================

:: Auto-detect Node.js in standard paths if not on current PATH
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs\;%PATH%"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs\;%PATH%"
    if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node\;%PATH%"
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is missing on this PC!
    echo 💡 Auto-running Setup script to install Node.js automatically...
    call Setup_New_PC.bat
    exit /b
)

if not exist "node_modules\express" (
    echo 📦 Installing dependencies...
    call npm install
)

echo 🚀 Launching background server...
start /b node server.js > server_desktop.log 2>&1

timeout /t 3 /nobreak >nul
echo ✨ Launching Desktop App Window...
start msedge --app=http://localhost:1100 || start chrome --app=http://localhost:1100 || start http://localhost:1100
