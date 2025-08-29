#!/usr/bin/env bash
set -euo pipefail

# Check if Vercel CLI is available
if ! command -v vercel >/dev/null 2>&1; then
  echo "ℹ️ Vercel CLI not found; skipping rollback (informational only)."
  exit 0
fi

# requires vercel CLI auth set up in CI
PREV=$(vercel ls adminer.online --limit 2 | awk 'NR==3{print $1}')
vercel alias set "$PREV" adminer.online
echo "✅ Rolled back to $PREV" 