#!/usr/bin/env bash
set -euo pipefail

echo "🔍 COMPREHENSIVE SYSTEM DIAGNOSIS"
echo "=================================="

# 0) What's actually deployed?
BASE="${BASE:-https://adminer.online}"
echo ""
echo "=== DEPLOYED STATE ==="
echo "Target: $BASE"

echo ""
echo "=== GET / (index.html) ==="
curl -fsSI "$BASE" | tee deployed.index.headers
curl -fsSL "$BASE" -o deployed.index.html

REF="$(grep -oE '/assets/index-[A-Za-z0-9]+\.js' deployed.index.html | head -n1 || true)"
echo "deployed bundle ref: $REF"

if [ -n "$REF" ]; then
  echo ""
  echo "=== HEAD bundle ==="
  curl -fsSI "$BASE$REF" | tee deployed.bundle.headers || echo "❌ bundle HEAD failed"
  echo ""
  echo "=== GET bundle ==="
  curl -fsSL "$BASE$REF" -o deployed.bundle.js || echo "❌ bundle GET failed"
else
  echo "❌ No bundle reference found in deployed index.html"
fi

# B) Local build state you expect to be serving
echo ""
echo "=== LOCAL BUILD STATE ==="
HTML="adminer/apps/api/public/index.html"
echo "Local SPA index: $HTML"
if [ -f "$HTML" ]; then
  echo "✅ Local index exists"
  echo "First 5 lines:"
  head -n 5 "$HTML"
  
  LOCAL_REF="$(grep -oE '/assets/index-[A-Za-z0-9]+\.js' "$HTML" | head -n1 || true)"
  echo "local bundle ref: $LOCAL_REF"
  
  if [ -n "$LOCAL_REF" ] && [ -f "adminer/apps/api/public$LOCAL_REF" ]; then
    echo "✅ Local bundle exists"
  else
    echo "❌ Local bundle missing"
  fi
else
  echo "❌ No local built index at $HTML"
fi

# C) Is any other web framework shadowing?
echo ""
echo "=== SHADOW DETECTORS ==="
echo "Next.js artifacts:"
find adminer -maxdepth 3 -type d \( -name ".next" -o -name "_next" \) -print 2>/dev/null || echo "None found"

echo ""
echo "Vercel config:"
if [ -f vercel.json ]; then
  echo "=== vercel.json ==="
  cat vercel.json
else
  echo "No vercel.json found"
fi

echo ""
echo "=== DUPLICATE DETECTORS ==="
echo "All index.html files (3 levels):"
find . -type f -name "index.html" | sed 's#^\./##' | sort

echo ""
echo "Any legacy public dirs:"
find adminer -maxdepth 4 -type d -name public | sed 's#^\./##' | sort

echo ""
echo "Vite builds lying around:"
find adminer -type d -name dist | sed 's#^\./##' | sort

echo ""
echo "=== GIT TRACKING ==="
echo "Tracked files in public:"
git ls-files adminer/apps/api/public | wc -l

echo ""
echo "=== SUMMARY ==="
if [ -n "$REF" ] && [ -n "$LOCAL_REF" ]; then
  if [ "$REF" = "$LOCAL_REF" ]; then
    echo "✅ Bundle references match - no stale HTML issue"
  else
    echo "❌ Bundle reference mismatch - serving stale HTML"
    echo "   Deployed: $REF"
    echo "   Local:    $LOCAL_REF"
  fi
else
  echo "⚠️  Cannot compare bundle references"
fi

echo ""
echo "Diagnosis complete. Check the outputs above for issues." 