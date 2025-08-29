#!/usr/bin/env bash
set -euo pipefail
# requires vercel CLI auth set up in CI
PREV=$(vercel ls adminer.online --limit 2 | awk 'NR==3{print $1}')
vercel alias set "$PREV" adminer.online
echo "✅ Rolled back to $PREV" 