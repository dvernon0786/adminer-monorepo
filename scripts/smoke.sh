#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/smoke.sh https://your-domain.tld [https://www.your-domain.tld]
#
# Notes:
# - Sends Accept: text/html to exercise SPA middleware
# - Hard-fails if /index.html returns a 308 (cleanUrls regression)
# - Verifies SPA routes, asset bypass, and API isolation

BASE_URL="${1:-http://localhost:3000}"
WWW_URL="${2:-}"
TIMEOUT="${SMOKE_TIMEOUT:-15}"
CURL="curl -sS --max-time ${TIMEOUT} -H 'Accept: text/html' -A 'smoke/1.0'"

pass() { echo "✅ $*"; }
fail() { echo "❌ $*"; exit 1; }

section() { echo; echo "== $* =="; }

status_code() {
  # $1 = url, $2 = extra curl args
  local url="$1"
  shift || true
  curl -sS -o /dev/null -D - "$@" "$url" | head -n1 | awk '{print $2}'
}

headers() {
  # $1 = url, $2.. = extra curl args
  local url="$1"; shift || true
  curl -sS -o /dev/null -D - "$@" "$url"
}

body() {
  # $1 = url, $2.. = extra curl args
  local url="$1"; shift || true
  curl -sS --max-time ${TIMEOUT} -H 'Accept: text/html' -A 'smoke/1.0' "$@" "$url"
}

require_200_html() {
  local url="$1"
  local sc
  sc=$(status_code "$url" -H 'Accept: text/html')
  [[ "$sc" == "200" ]] || fail "$url -> expected 200 HTML, got $sc"
}

require_no_308_index() {
  local url="${1%/}/index.html"
  local sc
  sc=$(status_code "$url" -H 'Accept: text/html' -L --proto-default https)
  [[ "$sc" != "308" && "$sc" != "301" && "$sc" != "302" ]] || fail "/index.html redirected ($sc). CleanUrls likely enabled."
}

section "WWW → APEX (optional)"
if [[ -n "$WWW_URL" ]]; then
  # fast guard: skip if host doesn't resolve or port 443 closed
  host="$(echo "$WWW_URL" | sed -E 's#https?://##; s#/.*$##')"
  if ! getent hosts "$host" >/dev/null 2>&1; then
    echo "ℹ️ WWW host not found; skipping."
  else
    code=$(status_code "$WWW_URL" -I || true)
    if [[ "$code" =~ ^30[12378]$ ]]; then
      loc=$(headers "$WWW_URL" -I | awk 'BEGIN{IGNORECASE=1}/^location:/{print $2}' | tr -d '\r')
      [[ "$loc" =~ ^${BASE_URL}/?$ ]] || fail "WWW redirect target mismatch: $loc"
      pass "WWW redirects to APEX"
    else
      echo "ℹ️ WWW not configured (got $code); skipping."
    fi
  fi
else
  echo "ℹ️ WWW URL not provided; skipping."
fi

section "Health"
require_200_html "${BASE_URL}/api/consolidated?action=health"
pass "Health endpoint reachable"

section "/index.html check (no cleanUrls)"
require_no_308_index "$BASE_URL"
pass "/index.html served directly (no 308/301/302)"

section "Middleware ping"
# We expect a custom header from middleware when SPA rewrite happens
# Your middleware should set:  x-mw: spa-rewrite  (or adjust the grep below)
hdrs=$(headers "${BASE_URL}/dashboard" -I -H 'Accept: text/html')
echo "$hdrs" | grep -iq "^x-mw:.*spa-rewrite" || fail "Middleware marker header missing on SPA route"
pass "Middleware executed on SPA route"

section "SPA /dashboard returns HTML"
html=$(body "${BASE_URL}/dashboard")
echo "$html" | grep -iq "<!doctype html" || fail "SPA did not return HTML"
pass "Valid HTML returned"

section "Asset bypass"
# Fetch /index.html and detect a built asset (js/css)
index_html="$(curl -s -L -H 'Accept: text/html' "${BASE_URL}/index.html")"
asset_path="$(printf "%s" "$index_html" | grep -oE '/assets/[^\" ]+\.(js|css)' | head -n1 || true)"

if [ -z "${asset_path:-}" ]; then
  fail "could not detect asset path from index.html"
fi
echo "Detected asset: $asset_path"

code=$(status_code "${BASE_URL}${asset_path}" -I -H 'Accept: */*' || true)
case "$code" in
  200) pass "Asset OK";;
  304) pass "Asset cached (304) OK";;
  206) pass "Asset partial content (206) OK";;
  *) fail "Expected asset 200/304/206, got $code";;
esac

section "API untouched by middleware"
# Expect no x-mw header for API paths (middleware should short-circuit)
hdrs=$(headers "${BASE_URL}/api/headers" -I -H 'Accept: */*' || true)
if echo "$hdrs" | grep -iq "^x-mw:"; then
  fail "Middleware header leaked into API response"
fi
pass "API clean (no middleware header)"

echo
pass "All smoke checks passed" 