#!/usr/bin/env bash
set -euo pipefail

KEEP="adminer/apps/api/vercel.json"
mapfile -t FILES < <(find . -name vercel.json -type f | sort)

if [[ "${#FILES[@]}" -ne 1 || "${FILES[0]}" != "./$KEEP" ]]; then
  echo "ERROR: Expected exactly one vercel.json at $KEEP (API app level)"
  printf 'Found:\n - %s\n' "${FILES[@]}"
  exit 1
fi

# Must be valid JSON
if ! jq . "$KEEP" >/dev/null 2>&1; then
  echo "ERROR: $KEEP is not valid JSON."
  exit 1
fi

# Allow both "routes" (Vercel legacy) and "rewrites" (Next.js)
# "routes" is more reliable for SPA fallback in Vercel
if grep -q '"routes"' "$KEEP"; then
  echo 'INFO: Using Vercel "routes" for SPA fallback (legacy format)'
fi
# Allow $1-style captures for Vercel legacy routes
# These are required for proper SPA fallback routing
if grep -Eq '\$[0-9]' "$KEEP"; then
  echo 'INFO: Using Vercel $1-style captures for legacy routes'
fi

# Require SPA fallback rule (Next.js uses rewrites, Vercel uses routes)
if grep -q '"rewrites"' "$KEEP"; then
  echo 'INFO: Using Next.js rewrites for SPA fallback'
elif grep -q 'index\.html' "$KEEP"; then
  echo 'INFO: Using Vercel routes for SPA fallback'
else
  echo 'ERROR: Missing SPA fallback configuration (rewrites or index.html)'
  exit 1
fi

echo "OK: vercel.json is valid and hygienic."
