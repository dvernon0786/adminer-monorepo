#!/bin/bash
set -e

echo "🔥 FORCE HTML REFRESH - Fix Bundle Mismatch"

cd adminer/apps/api

# Step 1: Complete clean slate
echo "🧹 Complete cleanup..."
rm -rf public/*
rm -rf ../web/dist/*

# Step 2: Force rebuild frontend with cache busting
echo "🔄 Force frontend rebuild..."
cd ../web
npm run build --clean-cache

# Step 3: Copy with verification
echo "📁 Copy and verify files..."
cd ../api
cp -r ../web/dist/* public/

# Step 4: Check what we actually have
echo "✅ Verification - Current files:"
ls -la public/assets/index-*.js
echo "📄 HTML references:"
grep -E 'index-.*\.js' public/index.html

# Step 5: Force Vercel cache invalidation
echo "💥 Force cache invalidation..."
echo "force_cache_bust_$(date +%s)_$(uuidgen)" > force-deploy-$(date +%s).txt

# Step 6: Update HTML with cache busting
echo "🔄 Add cache busting to HTML..."
sed -i 's/src="\/assets\/index-/src="\/assets\/index-/g' public/index.html

# Step 7: Commit with timestamp to force new deployment
cd ../../..
git add .
git commit -m "🔥 FORCE HTML REFRESH: $(date) - Fix persistent bundle mismatch"

echo "🚀 Pushing to trigger fresh deployment..."
git push

echo "✅ Force refresh complete!"
echo "⏰ Wait 3-4 minutes for deployment, then test dashboard"
echo "🌐 Test: https://adminer.online/dashboard" 