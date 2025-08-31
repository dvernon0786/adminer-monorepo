#!/bin/bash
set -e

echo "🔒 LOCAL ATOMIC BUILD: Ensuring HTML and JS bundle sync"

# Step 1: Clean slate
cd adminer/apps/web
echo "🧹 Cleaning web build..."
rm -rf dist/

# Step 2: Build with timestamp for cache busting
echo "🔨 Building frontend with timestamp..."
BUILD_TIMESTAMP=$(date +%s)
echo "// Build timestamp: $BUILD_TIMESTAMP" > src/build-info.ts
echo "export const BUILD_TIMESTAMP = $BUILD_TIMESTAMP;" >> src/build-info.ts

npm run build

# Step 3: Verify build output
echo "✅ Build completed. Generated files:"
ls -la dist/assets/

# Step 4: Atomic copy (all or nothing)
cd ../api
echo "🔄 Atomic copy to API public directory..."

# Create temporary directory
rm -rf public.tmp
mkdir -p public.tmp

# Copy all files to temp
cp -r ../web/dist/* public.tmp/

# Verify critical files exist
if [ ! -f "public.tmp/index.html" ]; then
    echo "❌ CRITICAL: index.html missing from build"
    exit 1
fi

# Get actual bundle name from HTML
HTML_BUNDLE=$(grep -E 'index-.*\.js' public.tmp/index.html | sed 's/.*index-\([^"]*\)\.js.*/index-\1.js/')
echo "📄 HTML references bundle: $HTML_BUNDLE"

# Verify bundle exists
if [ ! -f "public.tmp/assets/$HTML_BUNDLE" ]; then
    echo "❌ CRITICAL: Bundle $HTML_BUNDLE missing from build"
    exit 1
fi

echo "✅ Bundle verification passed: $HTML_BUNDLE exists"

# Step 5: Atomic swap (rename is atomic on most filesystems)
rm -rf public.old
mv public public.old
mv public.tmp public

echo "🎯 LOCAL ATOMIC BUILD COMPLETE: HTML and JS bundle are now in sync"
echo "📦 Bundle: $HTML_BUNDLE"
echo "🕒 Build timestamp: $BUILD_TIMESTAMP"
echo ""
echo "🚀 Ready to deploy! Run: cd adminer/apps/api && vercel --prod" 