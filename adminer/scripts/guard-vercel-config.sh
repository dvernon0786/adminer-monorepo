#!/usr/bin/env bash
set -euo pipefail

KEEP="adminer/apps/api/vercel.json"
mapfile -t FILES < <(find . -name vercel.json -type f | sort)

if [[ "${#FILES[@]}" -ne 1 || "${FILES[0]}" != "./$KEEP" ]]; then
  echo "ERROR: Expected exactly one vercel.json at $KEEP"
  printf 'Found:\n - %s\n' "${FILES[@]}"
  exit 1
fi

# Must be valid JSON
if ! jq . "$KEEP" >/dev/null 2>&1; then
  echo "ERROR: $KEEP is not valid JSON."
  exit 1
fi

# Block legacy/invalid patterns
if grep -q '"routes"' "$KEEP"; then
  echo 'ERROR: "routes" found. Use "rewrites" for Next.js projects.'
  exit 1
fi
if grep -Eq '\$[0-9]' "$KEEP"; then
  echo 'ERROR: Found $1-style captures. Use :path* tokens.'
  exit 1
fi

# Require SPA fallback rule
if ! grep -q '"destination": "/index.html"' "$KEEP"; then
  echo 'ERROR: Missing SPA fallback rewrite to /index.html.'
  exit 1
fi

echo "OK: vercel.json is valid and hygienic."
