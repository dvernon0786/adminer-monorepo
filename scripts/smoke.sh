#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://www.adminer.online}"  # default to www so we also validate redirect
APEX_URL="${APEX_URL:-https://adminer.online}"
WWW_URL="${WWW_URL:-https://www.adminer.online}"

echo "🔎 BASE_URL=${BASE_URL}"

red() { printf "\e[31m%s\e[0m\n" "$*"; }
grn() { printf "\e[32m%s\e[0m\n" "$*"; }
ylw() { printf "\e[33m%s\e[0m\n" "$*"; }

# 1) Canonical redirect (WWW -> APEX)
echo "== Canonical redirect: WWW → APEX =="
code=$(curl -s -o /dev/null -w "%{http_code}" -I "${WWW_URL}/")
loc=$(curl -s -I "${WWW_URL}/" | awk -F': ' 'tolower($1)=="location"{print $2}' | tr -d '\r\n')
echo "WWW / -> ${code} ${loc:-"(no Location)"}"
if [[ "$code" != "301" || "$loc" != "${APEX_URL}/" ]]; then
  red "❌ WWW root should 301 to APEX root"
  exit 1
else
  grn "✅ WWW root 301s to APEX root"
fi

# 2) SPA routes (should end as 200 text/html)
echo "== SPA routes return HTML 200 =="
check_html () {
  local url="$1"
  local http ct
  http=$(curl -s -L -o /dev/null -w "%{http_code}" "${url}")
  ct=$(curl -s -L -D - "${url}" -o /dev/null | awk -F': ' 'tolower($1)=="content-type"{print tolower($2)}' | tr -d '\r\n')
  echo "${url} -> ${http} ${ct}"
  if [[ "$http" != "200" || "$ct" != text/html* ]]; then
    red "❌ ${url} not HTML 200"
    exit 1
  fi
}

check_html "${APEX_URL}/"
check_html "${APEX_URL}/dashboard"
check_html "${APEX_URL}/sign-in"

# 3) API health
echo "== API health =="
api_status=$(curl -s -o /dev/null -w "%{http_code}" "${APEX_URL}/api/consolidated?action=health")
echo "/api/consolidated?action=health -> ${api_status}"
if [[ "$api_status" != "200" ]]; then
  red "❌ health not 200"
  exit 1
else
  grn "✅ health 200"
fi

# 4) Webhook methods guard (GET should be 405)
echo "== Webhook GET returns 405 =="
wh_status=$(curl -s -o /dev/null -w "%{http_code}" "${APEX_URL}/api/payments/webhook")
echo "/api/payments/webhook (GET) -> ${wh_status}"
if [[ "$wh_status" != "405" && "$wh_status" != "404" ]]; then
  # Allow 404 if route not present in this branch
  red "❌ webhook GET should be 405 (or 404 if absent)"
  exit 1
fi

grn "🎉 Smoke OK" 