@echo off
echo ========================================
echo Install APK via ADB
echo ========================================
echo.

REM Check if adb is available
where adb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ADB not found!
    echo.
    echo Please install Android Platform Tools:
    echo https://developer.android.com/studio/releases/platform-tools
    echo.
    echo Or add adb to your PATH
    pause
    exit /b 1
)

echo Checking connected devices...
adb devices
echo.

echo Make sure your tablet is connected via USB
echo and USB debugging is enabled!
echo.
pause

echo Installing attendance-system-debug.apk...
adb install -r attendance-system-debug.apk

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Installation successful!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Installation failed!
    echo ========================================
    echo.
    echo Common issues:
    echo 1. USB debugging not enabled
    echo 2. Device not authorized (check tablet screen)
    echo 3. APK file not found
    echo.
)

pause


