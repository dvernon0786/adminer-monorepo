#!/bin/bash
# Guard script for GitHub Actions CI/CD pipeline
# This script runs basic checks before allowing deployment

set -euo pipefail

echo "🔍 Running guard checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the right directory?"
    exit 1
fi

# Check if adminer submodule is present
if [ ! -d "adminer" ]; then
    echo "❌ Error: adminer submodule not found"
    exit 1
fi

# Check if adminer submodule is properly initialized (has .git directory)
if [ ! -d "adminer/.git" ]; then
    echo "⚠️  Warning: adminer submodule not properly initialized"
    echo "🔧 Attempting to initialize submodule..."
    
    # Try to initialize the submodule
    git submodule update --init --recursive || {
        echo "❌ Failed to initialize adminer submodule"
        exit 1
    }
fi

# Check if key configuration files exist
# find vercel.json in either legacy or current location
VERCEL_JSON="adminer/vercel.json"
if [ ! -f "$VERCEL_JSON" ]; then
  # new monorepo layout
  VERCEL_JSON="adminer/apps/api/vercel.json"
fi

if [ ! -f "$VERCEL_JSON" ]; then
  echo "❌ Error: vercel.json not found (checked adminer/vercel.json and adminer/apps/api/vercel.json)"
  exit 1
fi

echo "ℹ️  Using Vercel config at: $VERCEL_JSON"

# Check if package-lock.json exists (npm workspace requirement)
if [ ! -f "package-lock.json" ]; then
    echo "❌ Error: package-lock.json not found in root"
    exit 1
fi

# Check if adminer apps have package.json files
if [ ! -f "adminer/apps/api/package.json" ]; then
    echo "❌ Error: adminer/apps/api/package.json not found"
    echo "📁 Contents of adminer/apps/ directory:"
    ls -la adminer/apps/ || echo "Cannot list adminer/apps directory"
    exit 1
fi

if [ ! -f "adminer/apps/web/package.json" ]; then
    echo "❌ Error: adminer/apps/web/package.json not found"
    exit 1
fi

# Check if critical source files exist
if [ ! -f "adminer/apps/api/src/db/client.ts" ]; then
    echo "❌ Error: adminer/apps/api/src/db/client.ts not found"
    echo "📁 Contents of adminer/apps/api/src/db/ directory:"
    ls -la adminer/apps/api/src/db/ || echo "Cannot list db directory"
    exit 1
fi

if [ ! -f "adminer/apps/web/src/App.tsx" ]; then
    echo "❌ Error: adminer/apps/web/src/App.tsx not found"
    exit 1
fi

# Check if smoke test scripts exist
if [ ! -f "scripts/smoke.sh" ]; then
    echo "❌ Error: scripts/smoke.sh not found"
    exit 1
fi

if [ ! -f "scripts/mint-clerk-test-jwts.mjs" ]; then
    echo "❌ Error: scripts/mint-clerk-test-jwts.mjs not found"
    exit 1
fi

echo "✅ All guard checks passed!"
echo "🚀 Ready for deployment!"

exit 0 