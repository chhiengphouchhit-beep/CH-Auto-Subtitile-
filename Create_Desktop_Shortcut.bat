@echo off
title Creating Desktop Shortcut...
cd /d "%~dp0"

echo ==================================================
echo 🎬 Creating Khmer Caption Studio Desktop Shortcut...
echo ==================================================

set "TARGET_BAT=%~dp0Start_Khmer_Caption_Studio.bat"
set "ICON_PATH=%~dp0app_icon.ico"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Khmer Caption Studio.lnk"

powershell -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_BAT%'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%ICON_PATH%'; $s.Description = 'Khmer Caption Studio - AI Subtitle & Video Editor'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo ✨ SUCCESS: Khmer Caption Studio shortcut created on your Desktop!
    echo 📌 Icon: app_icon.ico
) else (
    echo ❌ Failed to create desktop shortcut.
)

pause
