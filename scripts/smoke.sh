#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-https://adminer.online}"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo
echo "== WWW → APEX (optional) =="
if [[ -n "${2:-}" ]]; then
  if curl -sfI "$2" | grep -qi '^location:'; then
    echo "✅ WWW redirects to APEX"
  else
    echo "ℹ️ WWW not configured; skipping."
  fi
else
  echo "ℹ️ WWW URL not provided; skipping."
fi

echo
echo "== Health =="
if curl -sf "$BASE/api/consolidated?action=health" | grep -q '"ok":true'; then
  echo "✅ Health endpoint reachable"
else
  echo "❌ Health endpoint not reachable"
  exit 1
fi

echo
echo "== /index.html check (no cleanUrls) =="
if curl -sfI "$BASE/index.html" | grep -qi '^location:'; then
  echo "❌ /index.html redirected (cleanUrls likely enabled)"
  exit 1
else
  echo "✅ /index.html served directly (no 308/301/302)"
fi

echo
echo "== Middleware ping =="
if ! curl -sI -H 'Accept: text/html' "$BASE/dashboard" | grep -qi '^x-mw:.*spa-direct'; then
  echo "❌ Middleware marker header missing on SPA route"
  exit 1
fi
echo "✅ Middleware marker header present on SPA route"

echo
echo "== SPA content sanity =="
# Ensure SPA root is present
if ! curl -s -H 'Accept: text/html' "$BASE/dashboard" | grep -qi 'id="root"'; then
  echo "❌ SPA root element not found in /dashboard HTML"
  exit 1
fi
echo "✅ SPA root element found"

echo
echo "== Asset loading check =="
# Grab a likely JS asset path from index.html (first /assets/*.js occurrence)
INDEX_HTML="$TMPDIR/index.html"
curl -s "$BASE/index.html" > "$INDEX_HTML"
ASSET_PATH="$(sed -n 's/.*src="\([^"]*\/assets\/[^"]*\.js\)".*/\1/p' "$INDEX_HTML" | head -n1)"

if [ -z "$ASSET_PATH" ]; then
  echo "❌ Could not discover a JS asset path in index.html"
  echo "   (No /assets/*.js reference found)"
  exit 1
fi

ASSET_URL="$BASE$ASSET_PATH"
HEADERS="$(curl -sI "$ASSET_URL")"
STATUS="$(printf "%s" "$HEADERS" | head -n1 | awk '{print $2}')"
CTYPE="$(printf "%s" "$HEADERS" | awk -F': ' '/^[Cc]ontent-[Tt]ype:/ {print $2}' | tr -d '\r')"

if [ "$STATUS" != "200" ]; then
  echo "❌ Asset not reachable: $ASSET_URL (status $STATUS)"
  exit 1
fi

if ! printf "%s" "$CTYPE" | grep -qi 'javascript'; then
  echo "❌ Asset Content-Type not JS-like: $CTYPE"
  exit 1
fi
echo "✅ Asset reachable and JS mime OK ($ASSET_URL, $CTYPE)"

echo
echo "All smoke checks passed ✅" 