#!/usr/bin/env bash
set -euo pipefail
APEX=https://adminer.online
WWW=https://www.adminer.online

echo "== WWW → APEX =="
code=$(curl -s -o /dev/null -I -w "%{http_code}" "$WWW/")
loc=$(curl -sI "$WWW/" | grep -i "^location:" | sed "s/^location: //i" | tr -d "\r")
echo "DEBUG: code=$code, loc='$loc'"
if [[ "$code" = "308" && "$loc" =~ ^https://adminer\.online ]]; then
    echo "✅ WWW redirect OK"
else
    echo "❌ Wrong WWW redirect: $code -> $loc"
    exit 1
fi

echo "== Health =="
code=$(curl -s -o /dev/null -I -w "%{http_code}" "$APEX/api/consolidated?action=health")
if [[ "$code" = "200" ]]; then
    echo "✅ Health OK"
else
    echo "❌ Health expected 200, got $code"
    exit 1
fi

echo "== SPA /dashboard (signed-out) =="
code=$(curl -s -o /dev/null -w "%{http_code}" "$APEX/dashboard")
if [[ "$code" = "200" ]]; then
    echo "✅ Dashboard status OK"
else
    echo "❌ /dashboard expected 200, got $code"
    exit 1
fi

body=$(curl -s "$APEX/dashboard" | tr -d '\r' | head -n 50)
if echo "$body" | grep -qi "html"; then
    echo "✅ HTML content found"
else
    echo "❌ Expected HTML content not found"
    exit 1
fi

if echo "$body" | grep -qi "Sign In Required"; then
    echo "✅ Sign-in banner found"
else
    echo "❌ Expected sign-in banner not found"
    exit 1
fi

echo "✅ SPA OK (protected state visible)"

echo "== Protected Endpoint (signed-out) =="
code=$(curl -s -o /dev/null -w "%{http_code}" "$APEX/api/consolidated?action=quota/status")
if [[ "$code" = "401" ]]; then
    echo "✅ Protected endpoint OK (401 when signed out)"
else
    echo "❌ Protected endpoint expected 401, got $code"
    exit 1
fi

echo "== All tests passed! 🎉 =="
