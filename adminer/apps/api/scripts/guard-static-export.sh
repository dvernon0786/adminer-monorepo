#!/bin/bash
set -euo pipefail

# Guard against Next.js static export builds for API app
# This script should be run after build to ensure we didn't accidentally export

echo "🔍 Checking for static export markers..."

# Check for Next.js export marker
if [ -f ".next/export-marker.json" ]; then
  echo "❌ CRITICAL: Next.js export marker found - build attempted static export"
  echo "   This will break all API routes and middleware"
  echo "   Check next.config.mjs and ensure output: 'standalone'"
  exit 1
fi

# Check for /out directory (static export output)
if [ -d "out" ]; then
  echo "❌ CRITICAL: /out directory found - build produced static export"
  echo "   This will break all API routes and middleware"
  echo "   Check next.config.mjs and ensure output: 'standalone'"
  exit 1
fi

# Check for serverless functions
if [ ! -d ".next/server" ]; then
  echo "❌ CRITICAL: .next/server directory missing - no serverless functions built"
  echo "   This indicates a build configuration problem"
  exit 1
fi

# Check for API routes in build output
if ! find .next/server -name "*.js" | grep -q "api"; then
  echo "❌ CRITICAL: No API routes found in build output"
  echo "   This indicates the build didn't include serverless functions"
  exit 1
fi

echo "✅ Build verification passed - no static export detected"
echo "✅ Serverless functions present"
echo "✅ API routes included" 