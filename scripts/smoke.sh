#!/usr/bin/env bash
set -euo pipefail

# -------- Config (env or defaults) --------
# If not provided by CI, fall back to hard-coded production domains.
APEX_URL="${APEX_URL:-https://adminer.online}"
WWW_URL="${WWW_URL:-https://www.adminer.online}"

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red() { printf "\033[31m%s\033[0m\n" "$*"; }

echo "🔎 APEX_URL=$APEX_URL"
echo "🔎 WWW_URL=$WWW_URL"

# Common curl flags:
#  -sS: silent but show errors
#  --max-redirs 10: avoid infinite loops
#  -D - : dump headers to stdout for assertions
CURL_BASE=(curl -sS --max-redirs 10)

# -------- 1) Canonical redirect: WWW -> APEX (301) --------
bold "== Canonical redirect: WWW → APEX =="

# Root redirect
WWW_ROOT_STATUS="$("${CURL_BASE[@]}" -I "$WWW_URL/" | awk '/^HTTP/{print $2}' | tail -1)"
WWW_ROOT_LOCATION="$("${CURL_BASE[@]}" -I "$WWW_URL/" | awk '/^location:/I{print $2}' | tr -d '\r')"

echo "WWW / -> $WWW_ROOT_STATUS ${WWW_ROOT_LOCATION:-}"
if [[ "$WWW_ROOT_STATUS" != "301" ]] || [[ "${WWW_ROOT_LOCATION:-}" != "$APEX_URL/" ]]; then
  red "❌ Expected 301 from $WWW_URL/ to $APEX_URL/"
  exit 1
fi
green "✅ WWW root 301s to APEX root"

# -------- 2) SPA routes (on APEX) must return HTML 200 (no -L) --------
bold "== SPA routes return HTML 200 =="

check_spa_route () {
  local path="$1"
  # We do NOT use -L here—rewrites should serve index.html directly on the same host.
  # Also assert Content-Type contains text/html.
  mapfile -t RESP < <("${CURL_BASE[@]}" -D - "$APEX_URL$path" -o /tmp/body.html)
  local STATUS CT
  STATUS="$(printf "%s\n" "${RESP[@]}" | awk '/^HTTP/{print $2}' | tail -1)"
  CT="$(printf "%s\n" "${RESP[@]}" | awk -F': ' 'tolower($1)=="content-type"{print tolower($2)}' | tr -d '\r' | tail -1)"

  echo "$APEX_URL$path -> $STATUS, content-type: ${CT:-unknown}"
  if [[ "$STATUS" != "200" ]]; then
    red "❌ Expected 200 for $path, got $STATUS"
    echo "----- Response headers -----"
    printf "%s\n" "${RESP[@]}"
    echo "----- Body head -----"
    head -n 60 /tmp/body.html || true
    exit 1
  fi
  if [[ "${CT:-}" != *"text/html"* ]]; then
    red "❌ Expected text/html for $path, got: ${CT:-unknown}"
    exit 1
  fi
}

check_spa_route "/"
check_spa_route "/dashboard"
check_spa_route "/settings/account"
check_spa_route "/jobs/12345"

green "✅ SPA routes serve HTML directly on APEX"

# -------- 3) API sanity --------
bold "== API health checks =="

API_STATUS="$("${CURL_BASE[@]}" -I "$APEX_URL/api/consolidated?action=health" | awk '/^HTTP/{print $2}' | tail -1)"
echo "/api/consolidated?action=health -> $API_STATUS"
if [[ "$API_STATUS" != "200" ]]; then
  red "❌ API health not 200"
  exit 1
fi

green "✅ All smoke checks passed" 