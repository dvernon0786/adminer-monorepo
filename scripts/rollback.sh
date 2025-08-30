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

# Remove current alias (non-interactive)
echo "🗑️  Removing current alias..."
echo "y" | vercel alias rm $ALIAS --token=$VERCEL_TOKEN || true

# Get deployments (no --limit flag, use head instead)  
echo "🔍 Finding previous deployment..."
DEPLOYMENTS=$(vercel ls --token=$VERCEL_TOKEN)
PREVIOUS_URL=$(echo "$DEPLOYMENTS" | sed -n '3p' | awk '{print $2}')

if [ -z "$PREVIOUS_URL" ]; then
    echo "❌ ERROR: No previous deployment found"
    exit 1
fi

echo "📋 Found previous deployment: $PREVIOUS_URL"

# Set alias to the previous deployment
echo "🔗 Setting alias to previous deployment..."
vercel alias set "$PREVIOUS_URL" $ALIAS --token=$VERCEL_TOKEN

echo "✅ Successfully rolled back to $PREVIOUS_URL"
echo "🌐 $ALIAS now points to: $PREVIOUS_URL"
echo ""
echo "💡 Rollback complete! The site should be accessible again."
echo "   Next deployment will automatically update the alias." 