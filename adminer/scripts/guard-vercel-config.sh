#!/bin/bash
set -e

echo "🔒 Running Vercel configuration guard..."

# Check if vercel.json exists at root
if [ ! -f "../vercel.json" ]; then
    echo "❌ vercel.json not found at repository root"
    exit 1
fi

# Check if install command uses correct path (allows debug commands before cd)
if ! grep -q "cd adminer/apps/api" "../vercel.json"; then
    echo "❌ Install command must cd into adminer/apps/api"
    echo "   Expected: ... && cd adminer/apps/api && npm ci"
    exit 1
fi

# Check if output directory uses correct path
if ! grep -q '"outputDirectory": "adminer/apps/api/.next"' "../vercel.json"; then
    echo "❌ Output directory must be adminer/apps/api/.next"
    exit 1
fi

# Check if build command is simplified (since install handles the cd)
if ! grep -q '"buildCommand": "npm run build"' "../vercel.json"; then
    echo "❌ Build command should be simplified to 'npm run build'"
    exit 1
fi

# Check for any incorrect paths that will break CI
if grep -q "cd apps/api" "../vercel.json"; then
    echo "❌ Found incorrect path 'cd apps/api' - this will break CI builds"
    echo "   CI environment expects: adminer/apps/api"
    echo "   Local environment has: ADminerFinal/adminer/apps/api"
    exit 1
fi

echo "✅ Install command uses correct path (adminer/apps/api)"
echo "✅ Output directory uses correct path (adminer/apps/api/.next)"
echo "✅ Build command is simplified (npm run build)"
echo "✅ No incorrect paths found"
echo "🎉 Vercel configuration guard passed!"
