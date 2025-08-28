#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://adminer.online"
TS=$(date +%s)

echo "=== SPA Smoke Test (ts=$TS) ==="

fail() {
  echo "❌ $1"
  exit 1
}

ok() {
  echo "✅ $1"
}

# 1) Ping middleware
echo "1) Middleware ping..."
PING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/__mw-check?_cb=$TS")
[[ "$PING_STATUS" == "200" ]] || fail "Middleware ping failed (got $PING_STATUS)"
ok "Middleware ping returned 200"

# 2) /dashboard SPA fallback (check 200 + header)
echo "2) /dashboard SPA fallback..."
DASH_HEADERS=$(curl -s -I -H "Accept: text/html" "$BASE_URL/dashboard?_cb=$TS")
echo "$DASH_HEADERS" | grep -q "^HTTP/.* 200" || fail "/dashboard did not return 200"
echo "$DASH_HEADERS" | grep -qi "^x-mw: spa-rewrite" || fail "/dashboard missing x-mw: spa-rewrite header"
ok "/dashboard returned 200 with x-mw: spa-rewrite"

# 3) /dashboard HTML starts with <!doctype
echo "3) /dashboard HTML content..."
DASH_HTML=$(curl -s -H "Accept: text/html" "$BASE_URL/dashboard?_cb=$TS" | head -n 1)
echo "$DASH_HTML" | grep -qi "<!doctype html" || fail "/dashboard content not HTML (got: $DASH_HTML)"
ok "/dashboard served valid HTML"

# 4) Asset bypass check
echo "4) Asset load..."
ASSET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/assets/index-B0pJ5BQP.js")
[[ "$ASSET_STATUS" =~ ^(200|304)$ ]] || fail "Asset did not load correctly (got $ASSET_STATUS)"
ok "Asset loaded with status $ASSET_STATUS"

# 5) API must not be rewritten
echo "5) API route check..."
API_HEADERS=$(curl -s -I "$BASE_URL/api/consolidated?action=health&_cb=$TS")
if echo "$API_HEADERS" | grep -qi "^x-mw:"; then
  fail "API route unexpectedly has x-mw header"
fi
ok "API untouched by middleware"

echo "=== All SPA smoke tests passed ✅ ===" 