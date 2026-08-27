@echo off
title Khmer Caption Studio Desktop
cd /d "%~dp0"
echo --------------------------------------------------
echo 🎬 Starting Khmer Caption Studio Desktop App...
echo --------------------------------------------------
start /b node server.js
timeout /t 2 /nobreak >nul
start msedge --app=http://localhost:1100 || start chrome --app=http://localhost:1100 || start http://localhost:1100
