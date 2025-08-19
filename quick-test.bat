@echo off
echo =========================================
echo  Submissions Synthesizer - Quick Test
echo =========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    echo Download from: https://nodejs.org/
    echo.
    echo For basic users: You can still use the app without tests
    echo Just open index.html in your browser
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
    echo.
)

echo 🧪 Running quick health check...
echo.

REM Run quick tests
npm run test:quick-check
if %errorlevel% equ 0 (
    echo.
    echo ✅ All tests passed! Your system is healthy.
    echo 🟢 Safe to proceed with important work.
) else (
    echo.
    echo ⚠️  Some tests failed. Check the errors above.
    echo 🟡 You can still use the app, but consider refreshing your browser.
)

echo.
echo =========================================
echo  Test Complete
echo =========================================
echo.
echo Quick tips:
echo - Add ?debug to your URL for real-time monitoring
echo - Save your work frequently with 'Save Session'
echo - Keep documents under 25MB for best performance
echo.
pause