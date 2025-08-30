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

# Get latest successful production deployment for this org
echo "🔍 Finding latest production deployment..."
DEPLOY_ID=$(vercel ls \
  --scope "$VERCEL_ORG_ID" \
  --token "$VERCEL_TOKEN" \
  --confirm | grep Production | head -n 1 | awk '{print $2}')

if [ -z "$DEPLOY_ID" ]; then
  echo "❌ No previous deployment found to rollback to."
  exit 1
fi

echo "🚀 Rolling back to deployment: $DEPLOY_ID"
vercel rollback "$DEPLOY_ID" \
  --token "$VERCEL_TOKEN" \
  --scope "$VERCEL_ORG_ID" \
  --yes

echo "✅ Rollback complete!" 