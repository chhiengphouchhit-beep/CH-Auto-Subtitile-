@echo off
set SCRIPT="%TEMP%\%RANDOM%-%RANDOM%.vbs"
set DESKTOP=%USERPROFILE%\Desktop
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%DESKTOP%\Khmer Caption Studio.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "D:\khmer-caption-studio\Launch_Desktop_App.vbs" >> %SCRIPT%
echo oLink.WorkingDirectory = "D:\khmer-caption-studio" >> %SCRIPT%
echo oLink.Description = "Khmer Caption Studio Desktop App" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript //nologo %SCRIPT%
del %SCRIPT%
echo Desktop shortcut created successfully on Desktop!
