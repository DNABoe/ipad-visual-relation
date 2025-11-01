@echo off
REM RelEye Windows Icon Setup Script
REM This script sets up file association and icon for .enc.releye files

echo.
echo ============================================
echo   RelEye File Icon Setup for Windows
echo ============================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

REM Prompt for icon file location
set /p ICON_PATH="Enter the full path to releye-icon.ico (e.g., C:\Icons\releye-icon.ico): "

REM Check if file exists
if not exist "%ICON_PATH%" (
    echo.
    echo Error: Icon file not found at: %ICON_PATH%
    echo Please make sure you've downloaded the icon file and entered the correct path.
    echo.
    pause
    exit /b 1
)

echo.
echo Setting up file association...

REM Create file extension association
reg add "HKEY_CURRENT_USER\Software\Classes\.enc.releye" /ve /d "RelEyeFile" /f >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: Failed to create file extension association
    pause
    exit /b 1
)

REM Create file type
reg add "HKEY_CURRENT_USER\Software\Classes\RelEyeFile" /ve /d "RelEye Encrypted Network" /f >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: Failed to create file type
    pause
    exit /b 1
)

REM Set icon
reg add "HKEY_CURRENT_USER\Software\Classes\RelEyeFile\DefaultIcon" /ve /d "\"%ICON_PATH%\"" /f >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: Failed to set icon
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo File association created for .enc.releye files
echo Icon set to: %ICON_PATH%
echo.
echo Restarting Windows Explorer to apply changes...
echo.

REM Restart Explorer
taskkill /f /im explorer.exe >nul 2>&1
start explorer.exe

echo.
echo Done! Your .enc.releye files should now show the RelEye icon.
echo.
echo Note: If the icon doesn't appear immediately:
echo   1. Press F5 to refresh the folder
echo   2. Try logging out and back in
echo   3. Restart your computer if needed
echo.
pause
