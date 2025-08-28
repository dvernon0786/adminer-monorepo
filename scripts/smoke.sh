#!/usr/bin/env bash
set -euo pipefail

APEX_URL="${APEX_URL:-https://adminer.online}"
WWW_URL="${WWW_URL:-https://www.adminer.online}"

echo "🔎 APEX_URL=$APEX_URL"
echo "🔎 WWW_URL=$WWW_URL"

is_preview=0
if [[ "$APEX_URL" == *".vercel.app"* ]]; then
  is_preview=1
fi

echo "== Canonical redirect: WWW → APEX =="

if [[ $is_preview -eq 1 ]]; then
  echo "ℹ️ Preview detected (.vercel.app) — skipping WWW redirect check to avoid SSL cert mismatch."
else
  # Check status code for redirect
  code=$(curl -sS -o /dev/null -I -w "%{http_code}" "$WWW_URL/")

  echo "WWW / -> $code"
  if [[ "$code" != "301" && "$code" != "308" ]]; then
    echo "❌ Expected 301 or 308 from $WWW_URL/ to $APEX_URL/"
    exit 1
  fi
fi

echo "== Health endpoint =="
health_url="$APEX_URL/api/consolidated?action=health"
code=$(curl -sS -o /dev/null -w "%{http_code}" "$health_url")
if [[ "$code" != "200" ]]; then
  echo "❌ Health check FAILED - Expected HTTP 200, got HTTP $code"
  # dump small body for debugging
  body=$(curl -sS "$health_url" || true)
  echo "   Body: $(echo "$body" | head -c 300)"
  exit 1
fi

echo "✅ Smoke OK" 