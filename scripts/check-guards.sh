#!/bin/bash
set -e

echo "🔒 Running Vercel configuration guards..."

# Check if vercel.json exists at root
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found at repository root"
    exit 1
fi

# Check if vercel.json paths are correct (must use adminer/apps/api for CI)
if ! grep -q "adminer/apps/api" vercel.json; then
    echo "❌ vercel.json paths are incorrect. Must use adminer/apps/api for CI"
    echo "   Current paths should be:"
    echo "   - installCommand: ... && cd adminer/apps/api && npm ci"
    echo "   - buildCommand: npm run build"
    echo "   - outputDirectory: adminer/apps/api/.next"
    exit 1
fi

# Check if install command uses correct path (allows debug commands before cd)
if ! grep -q "cd adminer/apps/api" vercel.json; then
    echo "❌ Install command must cd into adminer/apps/api"
    exit 1
fi

# Check if output directory uses correct path
if ! grep -q '"outputDirectory": "adminer/apps/api/.next"' vercel.json; then
    echo "❌ Output directory must be adminer/apps/api/.next"
    exit 1
fi

# Check if build command is simplified (since install handles the cd)
if ! grep -q '"buildCommand": "npm run build"' vercel.json; then
    echo "❌ Build command should be simplified to 'npm run build'"
    exit 1
fi

echo "✅ vercel.json paths are correct (using adminer/apps/api for CI)"
echo "✅ Install command uses correct path"
echo "✅ Build command is simplified"
echo "✅ Output directory uses correct path"

# Check for any incorrect paths that will break CI
if grep -q "cd apps/api" vercel.json; then
    echo "❌ Found incorrect path 'cd apps/api' - this will break CI builds"
    echo "   CI environment expects: adminer/apps/api"
    echo "   Local environment has: ADminerFinal/adminer/apps/api"
    exit 1
fi

echo "✅ No incorrect paths found"
echo "🎉 All Vercel configuration guards passed!" 