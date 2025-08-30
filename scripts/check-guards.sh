#!/usr/bin/env bash
set -euo pipefail

# Ensures:
# - vercel.json is present at root (single source of truth)
# - cleanUrls is NOT enabled
# - Prints the path used for clarity

ROOT="adminer/apps/api/vercel.json"

if [[ ! -f "$ROOT" ]]; then
  echo "❌ vercel.json not found (expected at ${ROOT})"
  exit 1
fi

VCONF="$ROOT"
echo "ℹ️ Using ${VCONF}"

# Block cleanUrls=true (causes 308 /index.html redirect; breaks SPA fallback tests)
if grep -qE '"cleanUrls"\s*:\s*true' "$VCONF"; then
  echo "❌ cleanUrls=true detected in ${VCONF}. Set to false or remove."
  exit 1
fi

# Friendly success
echo "✅ Guard passed: cleanUrls disabled; single vercel.json at ${VCONF}" 