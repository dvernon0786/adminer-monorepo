#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://adminer.online"
TS=$(date +%s)

log(){ echo -e "$1"; }
fail(){ echo "❌ $1"; exit 1; }
ok(){ echo "✅ $1"; }

log "== WWW → APEX =="
CODE=$(curl -s -o /dev/null -w "%{http_code}" -I "https://www.adminer.online/")
LOC=$(curl -s -D - -o /dev/null -I "https://www.adminer.online/" | awk -F': ' 'tolower($1)=="location"{print $2}' | tr -d '\r')
echo "DEBUG: code=$CODE, loc='$LOC'"
[[ "$CODE" == "308" && "$LOC" == "https://adminer.online/"* ]] || fail "WWW redirect bad"
ok "WWW redirect OK"

log "== Health =="
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/consolidated?action=health&_cb=$TS")
[[ "$HEALTH" == "200" ]] || fail "Health endpoint not 200"
ok "Health OK"

log "== Middleware ping =="
PING=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/__mw-check?_cb=$TS")
[[ "$PING" == "200" ]] || fail "Middleware ping failed ($PING)"
ok "Middleware executing"

log "== SPA /dashboard (signed-out) =="
# IMPORTANT: send Accept: text/html so middleware rewrites to /index.html
DASH_HEADERS=$(curl -s -I -H "Accept: text/html" "$BASE_URL/dashboard?_cb=$TS")
echo "$DASH_HEADERS" | grep -q "^HTTP/.* 200" || fail "/dashboard expected 200, got: $(echo "$DASH_HEADERS" | head -n1)"
echo "$DASH_HEADERS" | grep -qi "^x-mw: spa-rewrite" || fail "missing x-mw: spa-rewrite"
ok "/dashboard served by SPA"

log "== Asset bypass =="
ASSET_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/assets/index-B0pJ5BQP.js")
[[ "$ASSET_CODE" =~ ^(200|304)$ ]] || fail "Asset not served ($ASSET_CODE)"
ok "Asset served ($ASSET_CODE)"

log "== API untouched by middleware =="
API_HEADERS=$(curl -s -I "$BASE_URL/api/consolidated?action=health&_cb=$TS")
if echo "$API_HEADERS" | grep -qi "^x-mw:"; then
  fail "API unexpectedly has x-mw header"
fi
ok "API clean"

echo "🎉 All smoke checks passed"
