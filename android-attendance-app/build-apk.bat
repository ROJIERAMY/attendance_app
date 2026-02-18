@echo off
echo Building APK for Attendance System...
echo.

cd /d "%~dp0"

if not exist "gradlew.bat" (
    echo Error: gradlew.bat not found!
    echo Please make sure you have Android SDK and Gradle installed.
    pause
    exit /b 1
)

echo Cleaning previous build...
call gradlew.bat clean

echo Building release APK...
call gradlew.bat assembleRelease

if exist "app\build\outputs\apk\release\app-release.apk" (
    echo.
    echo ========================================
    echo APK built successfully!
    echo Location: app\build\outputs\apk\release\app-release.apk
    echo ========================================
) else (
    echo.
    echo Error: APK build failed!
    echo Please check the error messages above.
)

pause


