#!/usr/bin/env bash
set -euo pipefail

echo "♻️ Rolling back to previous deployment..."

# Check if Vercel CLI is available
if ! command -v vercel >/dev/null 2>&1; then
  echo "ℹ️ Vercel CLI not found; skipping rollback (informational only)."
  exit 0
fi

# Check if VERCEL_TOKEN is available
if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ℹ️ VERCEL_TOKEN not set; skipping rollback (informational only)."
  exit 1
fi

# Use Vercel's required method: both --scope and --project
echo "🚀 Rolling back to previous deployment..."
vercel rollback \
  --token "$VERCEL_TOKEN" \
  --scope "$VERCEL_ORG_ID" \
  --project "$VERCEL_PROJECT_ID" \
  --yes

echo "✅ Rollback complete!" 