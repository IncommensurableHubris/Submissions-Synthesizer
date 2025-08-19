#!/bin/bash

echo "========================================="
echo " Submissions Synthesizer - Quick Test"
echo "========================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    echo "Download from: https://nodejs.org/"
    echo
    echo "For basic users: You can still use the app without tests"
    echo "Just open index.html in your browser"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
    echo
fi

echo "🧪 Running quick health check..."
echo

# Run quick tests
npm run test:quick-check
if [ $? -eq 0 ]; then
    echo
    echo "✅ All tests passed! Your system is healthy."
    echo "🟢 Safe to proceed with important work."
else
    echo
    echo "⚠️  Some tests failed. Check the errors above."
    echo "🟡 You can still use the app, but consider refreshing your browser."
fi

echo
echo "========================================="
echo " Test Complete"
echo "========================================="
echo
echo "Quick tips:"
echo "- Add ?debug to your URL for real-time monitoring"
echo "- Save your work frequently with 'Save Session'"
echo "- Keep documents under 25MB for best performance"
echo

# Make script executable
chmod +x quick-test.sh