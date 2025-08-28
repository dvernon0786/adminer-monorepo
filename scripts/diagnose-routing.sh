#!/usr/bin/env bash
set -euo pipefail

APEX_URL="${APEX_URL:-https://adminer.online}"
WWW_URL="${WWW_URL:-https://www.adminer.online}"

bold() { printf "\n\033[1m%s\033[0m\n" "$*"; }
pass() { echo "✅ $*"; }
fail() { echo "❌ $*" ; exit 1; }
note() { echo "ℹ️  $*"; }

curl_head() {  # URL
  curl -sS -D - -o /dev/null -k "$1"
}

curl_trace() { # URL
  # Prints status + final URL (no body)
  curl -sS -o /dev/null -w "code=%{http_code} final=%{url_effective}\n" -L "$1"
}

expect_redirect() { # url expected_location
  local url="$1" expected="$2"
  bold "== Check redirect =="
  local hdr; hdr="$(curl_head "$url")" || true
  echo "$hdr"
  local code; code="$(printf "%s" "$hdr" | awk 'toupper($1)=="HTTP/"{c=$2} END{print c}')"
  local loc;  loc="$(printf "%s" "$hdr" | awk 'tolower($1)=="location:"{print $2}' | tr -d '\r')"

  if [[ "$code" =~ ^30(1|2|7|8)$ ]] && [[ "$loc" == "$expected"* ]]; then
    pass "Redirect OK: $url -> $loc ($code)"
  else
    echo
    fail "Expected 301/308 to $expected, got code=$code location=$loc"
  fi
}

expect_200_json() { # url
  local url="$1"
  bold "== Check 200 JSON =="
  local hdr; hdr="$(curl_head "$url")" || true
  echo "$hdr"
  local code; code="$(printf "%s" "$hdr" | awk 'toupper($1)=="HTTP/"{c=$2} END{print c}')"
  local ctype; ctype="$(printf "%s" "$hdr" | awk 'tolower($1)=="content-type:"{print $2}' | tr -d '\r')"
  if [[ "$code" == "200" && "$ctype" == application/json* ]]; then
    pass "200 JSON OK: $url"
  else
    # One more try following redirects to show where it lands
    note "Tracing redirects to explain…"
    curl_trace "$url"
    echo
    fail "Expected 200 JSON at $url, got code=$code content-type=$ctype"
  fi
}

expect_200_html() { # url
  local url="$1"
  bold "== Check SPA fallback (HTML 200) =="
  local hdr; hdr="$(curl_head "$url")" || true
  echo "$hdr"
  local code; code="$(printf "%s" "$hdr" | awk 'toupper($1)=="HTTP/"{c=$2} END{print c}')"
  local ctype; ctype="$(printf "%s" "$hdr" | awk 'tolower($1)=="content-type:"{print $2}' | tr -d '\r')"
  if [[ "$code" == "200" && "$ctype" == text/html* ]]; then
    pass "200 HTML OK (SPA): $url"
  else
    note "Tracing redirects to explain…"
    curl_trace "$url"
    echo
    fail "Expected 200 HTML (SPA) at $url, got code=$code content-type=$ctype"
  fi
}

expect_no_redirect() { # url
  local url="$1"
  bold "== Check no redirect =="
  local hdr; hdr="$(curl_head "$url")" || true
  echo "$hdr"
  local code; code="$(printf "%s" "$hdr" | awk 'toupper($1)=="HTTP/"{c=$2} END{print c}')"
  local loc;  loc="$(printf "%s" "$hdr" | awk 'tolower($1)=="location:"{print $2}' | tr -d '\r')"
  if [[ "$code" =~ ^30(1|2|7|8)$ ]]; then
    echo
    fail "Unexpected redirect (code=$code location=$loc) at $url — middleware or rewrite is interfering."
  else
    pass "No redirect at $url (code=$code)"
  fi
}

bold "DIAG: Print environment"
note "APEX_URL=$APEX_URL"
note "WWW_URL=$WWW_URL"

bold "Step 1: Host canonicalization (WWW → APEX)"
expect_redirect "${WWW_URL}/" "${APEX_URL}/"

bold "Step 2: Health endpoint must be 200 JSON (no 3xx)"
expect_200_json "${APEX_URL}/api/consolidated?action=health"

bold "Step 3: API must not redirect (middleware must be inert)"
expect_no_redirect "${APEX_URL}/api/consolidated?action=health"

bold "Step 4: Static files should not redirect (served directly)"
# Choose a likely-static path that should exist or 404 WITHOUT redirect
expect_no_redirect "${APEX_URL}/favicon.ico"

bold "Step 5: SPA route should resolve to index.html (200 text/html)"
# Pick a client route known to be SPA-handled; adjust if your route differs
expect_200_html "${APEX_URL}/dashboard"

bold "Step 6: Show Vercel routing/debug headers for last request"
note "Useful headers: x-vercel-id, x-matched-path, x-now-route-matches"
curl -sS -D - -o /dev/null "${APEX_URL}/dashboard" | grep -iE '^(x-vercel-id|x-matched-path|x-now-route-matches|server|cache-control):' || true

pass "Diagnostics complete." 