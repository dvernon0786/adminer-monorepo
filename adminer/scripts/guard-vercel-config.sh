#!/usr/bin/env bash
set -euo pipefail

KEEP="adminer/apps/api/vercel.json"
mapfile -t FILES < <(find . -name vercel.json -type f | sort)

if [[ "${#FILES[@]}" -ne 1 || "${FILES[0]}" != "./$KEEP" ]]; then
  echo "ERROR: Expected exactly one vercel.json at $KEEP"
  printf 'Found:\n - %s\n' "${FILES[@]}"
  exit 1
fi

# Block legacy patterns that break Next+Vercel
if grep -q '"routes"' "$KEEP"; then
  echo 'ERROR: "routes" found in vercel.json. Use "rewrites" instead.'
  exit 1
fi
if grep -q '\$[0-9]' "$KEEP"; then
  echo 'ERROR: Detected $1-style captures. Use :path* tokens in "source"/"destination".'
  exit 1
fi

# Require SPA fallback rule
if ! grep -q '"destination": "/index.html"' "$KEEP"; then
  echo 'ERROR: Missing SPA fallback rewrite to /index.html.'
  exit 1
fi

echo "OK: vercel.json hygiene looks good."
