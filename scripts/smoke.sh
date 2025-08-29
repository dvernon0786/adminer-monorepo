#!/usr/bin/env bash
set -euo pipefail

# Base URL can be overridden in CI if needed
BASE_URL="${BASE_URL:-https://adminer.online}"
TS=$(date +%s)

log(){ echo -e "$1"; }
fail(){ echo "❌ $1"; exit 1; }
ok(){ echo "✅ $1"; }

log "== WWW → APEX =="
CODE=$(curl -s -o /dev/null -w "%{http_code}" -I "https://www.${BASE_URL#https://}/")
LOC=$(curl -s -D - -o /dev/null -I "https://www.${BASE_URL#https://}/" | awk -F': ' 'tolower($1)=="location"{print $2}' | tr -d '\r')
echo "DEBUG: code=$CODE, loc='${LOC}'"
[[ "$CODE" == "308" && "$LOC" == "${BASE_URL}/" || "$LOC" == "${BASE_URL}"* ]] || fail "WWW redirect incorrect"
ok "WWW redirect OK"

log "== Health =="
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/consolidated?action=health&_cb=${TS}")
[[ "$HEALTH" == "200" ]] || fail "Health endpoint not 200"
ok "Health OK"

log "== /index.html check (no cleanUrls) =="
INDEX_HEADERS=$(curl -s -I "${BASE_URL}/index.html?_cb=${TS}")
FIRST_LINE=$(echo "$INDEX_HEADERS" | head -n1)
if echo "$FIRST_LINE" | grep -q " 308 "; then
  fail "/index.html returned 308 → cleanUrls regression"
fi
echo "$FIRST_LINE" | grep -q " 200 " || fail "/index.html not 200 (got: $FIRST_LINE)"
ok "/index.html served directly (no cleanUrls redirect)"

log "== Middleware ping =="
PING=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/__mw-check?_cb=${TS}")
[[ "$PING" == "200" ]] || fail "Middleware ping failed ($PING)"
ok "Middleware executing"

log "== SPA /dashboard (HTML navigation) =="
# Emulate a browser navigation: must include Accept: text/html
DASH_HEADERS=$(curl -s -I \
  -H "Accept: text/html" \
  -H "Cache-Control: no-cache" \
  -H "Pragma: no-cache" \
  -H "User-Agent: Mozilla/5.0" \
  "${BASE_URL}/dashboard?_cb=${TS}")
echo "$DASH_HEADERS" | grep -q "^HTTP/.* 200" || fail "/dashboard expected 200, got: $(echo "$DASH_HEADERS" | head -n1)"
echo "$DASH_HEADERS" | grep -qi "^x-mw: spa-rewrite" || fail "missing x-mw: spa-rewrite on /dashboard"
ok "/dashboard served by SPA (x-mw: spa-rewrite)"

log "== /dashboard HTML content sanity =="
DASH_HTML=$(curl -s \
  -H "Accept: text/html" \
  -H "Cache-Control: no-cache" \
  -H "User-Agent: Mozilla/5.0" \
  "${BASE_URL}/dashboard?_cb=${TS}" | head -n1)
echo "$DASH_HTML" | grep -qi "<!doctype html" || fail "content not HTML (got: $DASH_HTML)"
ok "Valid HTML returned"

log "== Asset bypass =="
ASSET_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/assets/index-B0pJ5BQP.js")
[[ "$ASSET_CODE" =~ ^(200|304)$ ]] || fail "Asset not served correctly ($ASSET_CODE)"
ok "Asset served ($ASSET_CODE)"

log "== API untouched by middleware =="
API_HEADERS=$(curl -s -I "${BASE_URL}/api/consolidated?action=health&_cb=${TS}")
if echo "$API_HEADERS" | grep -qi "^x-mw:"; then
  fail "API unexpectedly has x-mw header"
fi
ok "API clean (no middleware header)"

echo "🎉 All smoke checks passed" 