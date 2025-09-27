#!/bin/bash

echo "🔍 Verifying Support Ticketing System Build..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are you in the project root?"
    exit 1
fi

# Check if Angular CLI is available
if ! command -v ng &> /dev/null; then
    echo "⚠️  Angular CLI not found. Installing..."
    npm install -g @angular/cli
fi

echo "📦 Current directory structure:"
ls -la

echo ""
echo "🏗️  Building Angular application..."
npm install
npm run build

echo ""
echo "📁 Checking dist folder..."
if [ -d "dist" ]; then
    echo "✅ dist folder exists"
    ls -la dist/
    
    if [ -d "dist/demo" ]; then
        echo ""
        echo "📂 Contents of dist/demo:"
        ls -la dist/demo/
        
        echo ""
        echo "🔍 Checking for essential files:"
        
        # Check for index.html
        if [ -f "dist/demo/index.html" ]; then
            echo "✅ index.html found"
        else
            echo "❌ index.html missing"
        fi
        
        # Check for main.js (or main-*.js)
        if ls dist/demo/main*.js 1> /dev/null 2>&1; then
            echo "✅ main.js found"
        else
            echo "❌ main.js missing"
        fi
        
        # Check for styles.css (or styles-*.css)
        if ls dist/demo/styles*.css 1> /dev/null 2>&1; then
            echo "✅ styles.css found"
        else
            echo "❌ styles.css missing"
        fi
        
        # Check for polyfills.js (or polyfills-*.js)
        if ls dist/demo/polyfills*.js 1> /dev/null 2>&1; then
            echo "✅ polyfills.js found"
        else
            echo "❌ polyfills.js missing"
        fi
        
        echo ""
        echo "📊 File count in dist/demo: $(ls -1 dist/demo | wc -l)"
        echo "📏 Total size: $(du -sh dist/demo | cut -f1)"
        
    else
        echo "❌ dist/demo folder not found"
        echo "Available folders in dist:"
        ls -la dist/
    fi
else
    echo "❌ dist folder not found - build may have failed"
fi

echo ""
echo "🔧 Deployment readiness check:"
if [ -f "dist/demo/index.html" ] && ls dist/demo/main*.js 1> /dev/null 2>&1; then
    echo "✅ Build appears successful and ready for deployment"
    echo "📁 Deploy this folder: dist/demo/"
else
    echo "❌ Build incomplete or failed"
    echo "🔄 Try running: npm run build --prod"
fi

echo ""
echo "📋 Deployment files checklist:"
echo "  - index.html: $([ -f "dist/demo/index.html" ] && echo "✅" || echo "❌")"
echo "  - JavaScript files: $(ls dist/demo/*.js 2>/dev/null | wc -l) files"
echo "  - CSS files: $(ls dist/demo/*.css 2>/dev/null | wc -l) files"
echo "  - Assets folder: $([ -d "dist/demo/assets" ] && echo "✅" || echo "❌")"
echo "  - Favicon: $([ -f "dist/demo/favicon.ico" ] && echo "✅" || echo "❌")"