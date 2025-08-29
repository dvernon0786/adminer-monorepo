#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${BASE_URL:-https://adminer.online}}"

echo "⛅ SPA index via ${BASE_URL}..."
# quick sanity ping first (don't fail the whole job if this line fails)
curl -sSf "${BASE_URL}/" >/dev/null

# Delegate to the comprehensive checker if present; otherwise minimal fallback
if [[ -x "scripts/system-check.sh" ]]; then
  exec scripts/system-check.sh "${BASE_URL}"
fi

# Minimal fallback (kept for compatibility)
set -x
curl -sSf "${BASE_URL}/" >/dev/null
curl -sSf "${BASE_URL}/dashboard" >/dev/null
curl -sSf "${BASE_URL}/api/consolidated?action=health" | grep -qi "healthy"
echo "✅ Smoke OK" 