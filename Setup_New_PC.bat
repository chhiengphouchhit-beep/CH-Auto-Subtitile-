@echo off
title Setup Khmer Caption Studio on New PC
cd /d "%~dp0"
echo ==================================================
echo 🚀 Setting up Khmer Caption Studio on New PC...
echo ==================================================
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed on this PC.
    echo 💡 Please download and install Node.js from https://nodejs.org
    pause
    exit /b
)
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    )
echo 🔗 Creating Desktop Shortcut...
call Create_Desktop_Shortcut.bat
echo ✨ Setup Complete! Starting App...
call Start_Khmer_Caption_Studio.bat
