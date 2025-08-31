#!/bin/bash
set -e

echo "🔧 Fixing Dashboard Blank Screen - JavaScript Bundle Mismatch"

# Navigate to the API directory
cd adminer/apps/api

echo "📁 Current public directory contents:"
ls -la public/assets/

echo "🔍 Checking what HTML currently references:"
grep -E "index-.*\.js" public/index.html || echo "No JS reference found"

echo "🧹 Force clean rebuild to fix bundle mismatch..."
rm -rf public/*

# Rebuild the frontend
cd ../web
npm run build

# Copy the built files back
cd ../api
cp -r ../web/dist/* public/

echo "✅ Rebuilt files:"
ls -la public/assets/

echo "🔍 New HTML references:"
grep -E "index-.*\.js" public/index.html || echo "No JS reference found"

# Force Vercel to invalidate cache with timestamp
echo "🚀 Adding force deploy trigger..."
echo "force_deploy_$(date +%s)" > force-cache-invalidation.txt

# Commit and deploy
cd ../../..
git add .
git commit -m "CRITICAL FIX: Rebuild frontend to fix JavaScript bundle mismatch - dashboard blank screen"

echo "🎯 Pushing to trigger deployment with fresh HTML and JS bundle..."
git push

echo "✅ Deploy triggered! Wait 2-3 minutes then test dashboard again."
echo "🌐 Test URL: https://adminer.online/dashboard" 