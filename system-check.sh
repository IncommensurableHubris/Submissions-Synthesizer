#!/bin/bash

echo "=========================================="
echo " Submissions Synthesizer - System Doctor"
echo "=========================================="
echo

# Basic system information
echo "🔍 System Information:"
echo "System: $(uname -s) $(uname -r)"
echo "User: $(whoami)"
echo "Date: $(date)"
echo

# Check browser availability
echo "🌐 Browser Check:"
echo "Checking installed browsers..."

# Chrome/Chromium check
if command -v google-chrome &> /dev/null; then
    echo "✅ Chrome detected"
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium detected"
elif command -v chromium &> /dev/null; then
    echo "✅ Chromium detected"
else
    echo "⚠️  Chrome/Chromium not found"
fi

# Firefox check
if command -v firefox &> /dev/null; then
    echo "✅ Firefox detected"
else
    echo "⚠️  Firefox not found"
fi

# Safari check (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -d "/Applications/Safari.app" ]; then
        echo "✅ Safari detected"
    else
        echo "⚠️  Safari not found"
    fi
fi

echo

# Check disk space
echo "💾 Disk Space Check:"
df -h . | tail -1 | awk '{print "Free space: " $4 " available of " $2 " total"}'
echo

# Check available memory
echo "🧠 Memory Check:"
if command -v free &> /dev/null; then
    free -h | grep "Mem:" | awk '{print "Available RAM: " $7 " of " $2}'
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Available RAM: $(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//' | awk '{print $1 * 4096 / 1024 / 1024 " MB"}')"
fi
echo

# Check development tools
echo "🔧 Development Tools:"
if command -v node &> /dev/null; then
    echo "✅ Node.js available"
    echo "Version: $(node --version)"
    echo "npm version: $(npm --version)"
    
    # Run comprehensive check if Node.js is available
    if [ -f "package.json" ]; then
        echo
        echo "🧪 Running comprehensive system check..."
        npm run doctor
    fi
else
    echo "⚠️  Node.js not installed (optional for basic use)"
    echo
    echo "💡 Basic Usage Available:"
    echo "You can still use the Submissions Synthesizer by:"
    echo "1. Opening index.html in any web browser"
    echo "2. Using all features except automated testing"
    echo "3. Monitoring performance manually with ?debug URL"
fi

echo
echo "=========================================="
echo " System Check Complete"
echo "=========================================="
echo

# Security recommendations
echo "🔒 Security Recommendations:"
echo "✅ Keep your browser updated"
echo "✅ Use the latest OS security updates"
echo "✅ Work offline for sensitive documents"
echo "✅ Save sessions locally only"
echo

# Performance tips
echo "⚡ Performance Tips:"
echo "✅ Close unnecessary browser tabs"
echo "✅ Restart browser after heavy use"
echo "✅ Keep documents under 25MB"
echo "✅ Clear browser cache weekly"
echo

# Make script executable
chmod +x system-check.sh