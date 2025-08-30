#!/bin/bash
set -e

echo "🔒 Running Vercel configuration guards..."

# Check if vercel.json exists at root
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found at repository root"
    exit 1
fi

# Check if vercel.json paths are correct (no cd commands needed)
if grep -q "cd adminer/apps/api" vercel.json; then
    echo "❌ vercel.json should not contain cd commands - Vercel runs from adminer/apps/api directly"
    echo "   Current paths should be:"
    echo "   - installCommand: npm ci"
    echo "   - buildCommand: npm run build"
    echo "   - outputDirectory: .next"
    exit 1
fi

# Check if install command is simplified
if ! grep -q '"installCommand": "npm ci"' vercel.json; then
    echo "❌ Install command should be simplified to 'npm ci'"
    exit 1
fi

# Check if output directory uses correct relative path
if ! grep -q '"outputDirectory": ".next"' vercel.json; then
    echo "❌ Output directory must be '.next' (relative to adminer/apps/api)"
    exit 1
fi

# Check if build command is simplified
if ! grep -q '"buildCommand": "npm run build"' vercel.json; then
    echo "❌ Build command should be simplified to 'npm run build'"
    exit 1
fi

echo "✅ vercel.json paths are correct (no cd commands needed)"
echo "✅ Install command is simplified (npm ci)"
echo "✅ Build command is simplified (npm run build)"
echo "✅ Output directory uses relative path (.next)"

# Check for any incorrect paths that will break CI
if grep -q "cd apps/api" vercel.json; then
    echo "❌ Found incorrect path 'cd apps/api' - this will break CI builds"
    exit 1
fi

echo "✅ No incorrect paths found"
echo "🎉 All Vercel configuration guards passed!" 