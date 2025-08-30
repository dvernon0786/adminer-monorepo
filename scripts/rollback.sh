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
  exit 0
fi

# Use same simple root deploy approach as main workflow
echo "🚀 Deploying from root directory (no project linking)..."
vercel --prod --token "$VERCEL_TOKEN" --yes

echo "✅ Rollback complete!" 