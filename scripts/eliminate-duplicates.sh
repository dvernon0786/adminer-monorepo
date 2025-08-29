#!/usr/bin/env bash
set -euo pipefail

echo "🧹 ELIMINATING ALL DUPLICATES AND OLD ARCHITECTURE"
echo "=================================================="

# Stop tracking generated files forever
echo "1. Removing generated files from git tracking..."
git rm -r --cached adminer/apps/api/public/* 2>/dev/null || true
echo "adminer/apps/api/public/" >> .gitignore
echo "✅ Git tracking fixed"

# Delete any Next.js or stray public dirs that could be deployed
echo ""
echo "2. Removing Next.js artifacts..."
rm -rf adminer/apps/**/.next adminer/apps/**/_next 2>/dev/null || true
echo "✅ Next.js artifacts removed"

echo ""
echo "3. Removing legacy public directories..."
find adminer -maxdepth 3 -type d -name public \
  | grep -v '^adminer/apps/api/public$' \
  | xargs -I{} rm -rf "{}" 2>/dev/null || true
echo "✅ Legacy public directories removed"

echo ""
echo "4. Cleaning all vite dist except the source web one..."
find adminer -type d -name dist \
  | grep -v '^adminer/apps/web/dist$' \
  | xargs -I{} rm -rf "{}" 2>/dev/null || true
echo "✅ Stale dist directories removed"

echo ""
echo "5. Verifying cleanup..."
echo "Remaining index.html files:"
find . -type f -name "index.html" | sed 's#^\./##' | sort

echo ""
echo "Remaining public directories:"
find adminer -maxdepth 4 -type d -name public | sed 's#^\./##' | sort

echo ""
echo "Remaining dist directories:"
find adminer -type d -name dist | sed 's#^\./##' | sort

echo ""
echo "Git tracking status:"
git ls-files adminer/apps/api/public | wc -l

echo ""
echo "✅ DUPLICATE ELIMINATION COMPLETE"
echo "Now run: ./scripts/vercel-build.sh to rebuild clean" 