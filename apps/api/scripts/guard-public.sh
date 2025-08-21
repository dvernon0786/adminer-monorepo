#!/usr/bin/env bash
set -euo pipefail

# Get the absolute path to the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Go up to the adminer root (scripts -> api -> adminer)
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PUB="$ROOT/public"

echo "Script dir: $SCRIPT_DIR"
echo "Root: $ROOT"
echo "Public: $PUB"

# 1) existence
test -f "$PUB/index.html" || { echo "❌ public/index.html missing"; exit 1; }
test -d "$PUB/assets" || { echo "❌ public/assets missing"; exit 1; }

# 2) index.html must reference /assets/ (NOT /public/assets)
if grep -Rqs "/public/assets" "$PUB/index.html"; then
  echo "❌ index.html contains /public/assets — must be /assets"
  exit 1
fi

# 3) ensure at least one .js and one .css exists
JS_COUNT=$(find "$PUB/assets" -type f -name "*.js" | wc -l | tr -d ' ')
CSS_COUNT=$(find "$PUB/assets" -type f -name "*.css" | wc -l | tr -d ' ')
if [ "$JS_COUNT" -eq 0 ] || [ "$CSS_COUNT" -eq 0 ]; then
  echo "❌ Missing built JS or CSS in /assets"
  exit 1
fi

echo "✅ public payload looks good" 