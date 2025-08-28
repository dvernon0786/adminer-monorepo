#!/usr/bin/env bash
set -euo pipefail
APEX=https://adminer.online
WWW=https://www.adminer.online

echo "== WWW → APEX =="
code=$(curl -s -o /dev/null -I -w "%{http_code}" "$WWW/")
loc=$(curl -sI "$WWW/" | grep -i "^location:" | sed 's/^location: //i' | tr -d '\r')
echo "DEBUG: code=$code, loc='$loc'"
test "$code" = "308" && [[ "$loc" =~ ^https://adminer\.online ]] || { echo "❌ Wrong WWW redirect: $code -> $loc"; exit 1; }
echo "✅ WWW redirect OK"

echo "== Health =="
code=$(curl -s -o /dev/null -I -w "%{http_code}" "$APEX/api/consolidated?action=health")
test "$code" = "200" || { echo "❌ Health expected 200, got $code"; exit 1; }
echo "✅ Health OK"

echo "== SPA /dashboard (signed-out) =="
# GET for 200 HTML content
code=$(curl -s -o /dev/null -w "%{http_code}" "$APEX/dashboard")
test "$code" = "200" || { echo "❌ /dashboard expected 200, got $code"; exit 1; }
# Check for HTML content and expected banner
body=$(curl -s "$APEX/dashboard" | tr -d '\r' | head -n 50)
echo "$body" | grep -qi "html" || { echo "❌ Expected HTML content not found"; exit 1; }
echo "$body" | grep -qi "Sign In Required" || { echo "❌ Expected sign-in banner not found"; exit 1; }
echo "✅ SPA OK (protected state visible)"

echo "== Protected Endpoint (signed-out) =="
# This should return 401 when not authenticated
code=$(curl -s -o /dev/null -w "%{http_code}" "$APEX/api/consolidated?action=quota/status")
test "$code" = "401" || { echo "❌ Protected endpoint expected 401, got $code"; exit 1; }
echo "✅ Protected endpoint OK (401 when signed out)"

echo "== All tests passed! 🎉 ==" 