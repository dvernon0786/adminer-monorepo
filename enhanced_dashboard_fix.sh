#!/bin/bash
set -e

echo "React Rendering Debug Script"
echo "============================"

cd adminer/apps/web

# Step 1: Build with debug logging
echo "1. Building with debug logging..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful with debug logging"

# Step 2: Copy to API directory
echo "2. Copying debug build to API directory..."
cd ../api
rm -rf public/*
cp -r ../web/dist/* public/

# Step 3: Verify bundle contents
echo "3. Checking if debug logs are in bundle..."
BUNDLE_FILE=$(ls public/assets/index-*.js | head -1)
echo "Bundle: $BUNDLE_FILE"

if grep -q "MAIN.TSX: Starting React app" "$BUNDLE_FILE"; then
    echo "✅ Debug logs found in bundle"
else
    echo "❌ Debug logs not found in bundle"
fi

if grep -q "APP.TSX: App component starting" "$BUNDLE_FILE"; then
    echo "✅ App.tsx debug logs found in bundle"
else
    echo "❌ App.tsx debug logs not found in bundle"
fi

echo ""
echo "Debug build complete!"
echo "==================="
echo ""
echo "Next steps:"
echo "1. Restart server: pkill -f simple-server && node simple-server.cjs &"
echo "2. Test dashboard: http://localhost:3000/dashboard"
echo "3. Check browser console for debug messages"
echo ""
echo "Look for these debug messages:"
echo "  - 🚀 MAIN.TSX: Starting React app initialization..."
echo "  - 🔑 MAIN.TSX: Clerk key: Present/Missing"
echo "  - 🎯 MAIN.TSX: Root element: Found/Not found"
echo "  - ✅ MAIN.TSX: App render called successfully"
echo "  - 🎭 APP.TSX: App component starting..."
echo "  - 🎭 APP.TSX: App function executing..."
echo "  - 🎭 APP.TSX: About to return JSX..."
echo ""
echo "If you see all debug messages but still blank screen:"
echo "Problem is in Dashboard component logic"
