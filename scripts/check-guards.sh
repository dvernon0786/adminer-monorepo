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

# Check if key configuration files exist
if [ ! -f "adminer/vercel.json" ]; then
    echo "❌ Error: adminer/vercel.json not found"
    exit 1
fi

# Check if package-lock.json exists (npm workspace requirement)
if [ ! -f "package-lock.json" ]; then
    echo "❌ Error: package-lock.json not found in root"
    exit 1
fi

# Check if adminer apps have package.json files
if [ ! -f "adminer/apps/api/package.json" ]; then
    echo "❌ Error: adminer/apps/api/package.json not found"
    exit 1
fi

if [ ! -f "adminer/apps/web/package.json" ]; then
    echo "❌ Error: adminer/apps/web/package.json not found"
    exit 1
fi

# Check if critical source files exist
if [ ! -f "adminer/apps/api/src/db/client.ts" ]; then
    echo "❌ Error: adminer/apps/api/src/db/client.ts not found"
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