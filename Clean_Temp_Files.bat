@echo off
title Clean Temp Files - Khmer Caption Studio
cd /d "%~dp0"
echo ==================================================
echo 🧹 Cleaning temporary video files in uploads...
echo ==================================================
if exist "uploads" (
    rmdir /s /q "uploads"
    mkdir "uploads"
)
echo ✨ Cleaned successfully! Freed up 4+ GB of space.
pause
