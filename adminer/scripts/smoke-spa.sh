#!/usr/bin/env bash
set -euo pipefail
URL="https://adminer.online/dashboard?_cb=$(date +%s)"

code=$(curl -s -o /tmp/page.html -w "%{http_code}" "$URL")
if [ "$code" != "200" ]; then
  echo "FAIL: $URL returned $code"
  head -n 30 /tmp/page.html
  exit 1
fi

# Look for basic HTML markers from Vite index.html
if ! grep -qi "<!doctype html" /tmp/page.html; then
  echo "FAIL: Response does not look like SPA index.html"
  head -n 30 /tmp/page.html
  exit 1
fi

echo "OK: SPA fallback served index.html (200)." 