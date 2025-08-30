#!/bin/bash
set -euo pipefail

ALIAS="adminer.online"

echo "♻️ Rolling back alias $ALIAS..."

# Check if VERCEL_TOKEN is set
if [ -z "${VERCEL_TOKEN:-}" ]; then
    echo "❌ ERROR: VERCEL_TOKEN environment variable is required"
    echo "   Set it with: export VERCEL_TOKEN=your_token_here"
    exit 1
fi

# Remove current alias (if exists) - ignore errors
echo "🗑️  Removing current alias..."
vercel alias rm $ALIAS --token=$VERCEL_TOKEN || true

# Find the previous successful deployment (skip the latest which may have failed)
echo "🔍 Finding previous deployment..."
PREVIOUS_DEPLOY=$(vercel ls --token=$VERCEL_TOKEN --limit=2 --json | jq -r '.[1].url')

if [ -z "$PREVIOUS_DEPLOY" ] || [ "$PREVIOUS_DEPLOY" = "null" ]; then
    echo "❌ ERROR: No previous deployment found to roll back to."
    echo "   This usually means there's only one deployment or the latest failed."
    exit 1
fi

echo "📋 Found previous deployment: $PREVIOUS_DEPLOY"

# Set alias to the previous deployment
echo "🔗 Setting alias to previous deployment..."
vercel alias set https://$PREVIOUS_DEPLOY $ALIAS --token=$VERCEL_TOKEN

echo "✅ Successfully rolled back to $PREVIOUS_DEPLOY"
echo "🌐 $ALIAS now points to: https://$PREVIOUS_DEPLOY"
echo ""
echo "💡 Rollback complete! The site should be accessible again."
echo "   Next deployment will automatically update the alias." 