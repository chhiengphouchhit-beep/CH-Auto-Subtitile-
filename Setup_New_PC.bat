@echo off
title Setup Khmer Caption Studio on New PC
cd /d "%~dp0"
echo ==================================================
echo 🚀 Setting up Khmer Caption Studio on New PC...
echo ==================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚡ Node.js not detected! Auto-downloading official Node.js installer...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v20.17.0/node-v20.17.0-x64.msi', 'node_setup.msi')"
    
    echo 📦 Installing Node.js automatically in background (Please wait ~15 seconds)...
    start /wait msiexec /i node_setup.msi /qn /norestart
    
    echo 🧹 Cleaning setup temp files...
    if exist node_setup.msi del /f /q node_setup.msi >nul 2>&1
    
    set "PATH=C:\Program Files\nodejs\;%PATH%"
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    set "PATH=C:\Program Files\nodejs\;%PATH%"
)

if not exist "node_modules" (
    echo 📦 Installing app dependencies...
    call npm install
)

echo 🔗 Creating Desktop Shortcut...
call Create_Desktop_Shortcut.bat

echo ✨ Setup 100% Complete! Launching Khmer Caption Studio...
call Start_Khmer_Caption_Studio.bat
