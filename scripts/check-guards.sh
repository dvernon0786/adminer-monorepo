#!/usr/bin/env bash
set -euo pipefail

# Ensures:
# - Exactly one vercel.json is present (root or apps/api)
# - cleanUrls is NOT enabled
# - Prints the path used for clarity

ROOT="vercel.json"
API="adminer/apps/api/vercel.json"

found=()
[[ -f "$ROOT" ]] && found+=("$ROOT")
[[ -f "$API"  ]] && found+=("$API")

if [[ ${#found[@]} -eq 0 ]]; then
  echo "❌ vercel.json not found (expected at ./vercel.json or ./apps/api/vercel.json)"
  exit 1
fi

if [[ ${#found[@]} -gt 1 ]]; then
  echo "❌ Multiple vercel.json files detected:"
  printf ' - %s\n' "${found[@]}"
  echo "Please keep only one."
  exit 1
fi

VCONF="${found[0]}"
echo "ℹ️ Using ${VCONF}"

# Block cleanUrls=true (causes 308 /index.html redirect; breaks SPA fallback tests)
if grep -qE '"cleanUrls"\s*:\s*true' "$VCONF"; then
  echo "❌ cleanUrls=true detected in ${VCONF}. Set to false or remove."
  exit 1
fi

# Friendly success
echo "✅ Guard passed: cleanUrls disabled; single vercel.json at ${VCONF}" 