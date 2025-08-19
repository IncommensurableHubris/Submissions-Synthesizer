@echo off
echo ==========================================
echo  Submissions Synthesizer - System Doctor
echo ==========================================
echo.

REM Basic system information
echo 🔍 System Information:
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo Date: %DATE% %TIME%
echo.

REM Check browser versions
echo 🌐 Browser Check:
echo Checking installed browsers...

REM Chrome check
reg query "HKEY_CURRENT_USER\Software\Google\Chrome\BLBeacon" /v version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Chrome detected
) else (
    echo ⚠️  Chrome not found in registry
)

REM Firefox check
if exist "%ProgramFiles%\Mozilla Firefox\firefox.exe" (
    echo ✅ Firefox detected
) else if exist "%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe" (
    echo ✅ Firefox detected
) else (
    echo ⚠️  Firefox not found
)

REM Edge check (built into Windows 10+)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    echo ✅ Edge detected
) else (
    echo ⚠️  Edge not found
)

echo.

REM Check disk space
echo 💾 Disk Space Check:
for /f "tokens=3" %%i in ('dir C:\ /-c ^| find "bytes free"') do set free=%%i
echo Free space on C: drive: %free% bytes
echo.

REM Check if Node.js is available
echo 🔧 Development Tools:
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js available
    node --version
    npm --version
    
    REM Run comprehensive check if Node.js is available
    if exist package.json (
        echo.
        echo 🧪 Running comprehensive system check...
        npm run doctor
    )
) else (
    echo ⚠️  Node.js not installed (optional for basic use)
    echo.
    echo 💡 Basic Usage Available:
    echo You can still use the Submissions Synthesizer by:
    echo 1. Opening index.html in any web browser
    echo 2. Using all features except automated testing
    echo 3. Monitoring performance manually with ?debug URL
)

echo.
echo ==========================================
echo  System Check Complete
echo ==========================================
echo.

REM Security recommendations
echo 🔒 Security Recommendations:
echo ✅ Keep your browser updated
echo ✅ Use the latest version of Windows
echo ✅ Work offline for sensitive documents
echo ✅ Save sessions locally only
echo.

REM Performance tips
echo ⚡ Performance Tips:
echo ✅ Close unnecessary browser tabs
echo ✅ Restart browser after heavy use
echo ✅ Keep documents under 25MB
echo ✅ Clear browser cache weekly
echo.

pause