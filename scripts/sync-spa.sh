#!/usr/bin/env bash
set -euo pipefail

WEB_DIR="adminer/apps/web"
API_PUBLIC="adminer/apps/api/public"

# 1) build web
cd "$WEB_DIR"
npm run build

# 2) empty public and copy fresh dist
cd - >/dev/null
rm -rf "$API_PUBLIC"
mkdir -p "$API_PUBLIC"
cp -r "$WEB_DIR/dist/"* "$API_PUBLIC/"

# 3) sanity check
test -f "$API_PUBLIC/index.html"
test -d "$API_PUBLIC/assets"
echo "Synced SPA into $API_PUBLIC" 