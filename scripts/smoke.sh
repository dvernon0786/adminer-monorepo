#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:3000}"

echo "⛅ SPA index..."
curl -fsSL "$BASE/" -o smoke_index.html

echo "🔗 parse main bundle..."
BUNDLE=$(grep -oE '/assets/index-[A-Za-z0-9]+\.js' smoke_index.html | head -n1 || true)
test -n "$BUNDLE" || { echo "No bundle in index.html"; exit 1; }

echo "📦 fetch bundle..."
curl -fsSL "$BASE$BUNDLE" -o smoke_bundle.js

echo "🩺 health..."
curl -fsSI "$BASE/api/consolidated?action=health" | head -n 1 | grep "200" >/dev/null

echo "🧮 quota (unauth should be 401 or 200 shim per your impl)..."
curl -fsSI "$BASE/api/consolidated?action=quota/status" | head -n 1

echo "✅ Smoke passed for $BASE" 