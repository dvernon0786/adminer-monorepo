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

# Try to get project context from current directory or environment
if [ -n "${VERCEL_PROJECT_ID:-}" ]; then
    echo "🔍 Using VERCEL_PROJECT_ID: $VERCEL_PROJECT_ID"
    # Use project-specific deployment listing
    DEPLOYMENTS=$(vercel deployments ls --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID 2>/dev/null || echo "")
elif [ -n "${VERCEL_ORG_ID:-}" ]; then
    echo "🔍 Using VERCEL_ORG_ID: $VERCEL_ORG_ID"
    # Try to list deployments with org context
    DEPLOYMENTS=$(vercel deployments ls --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID 2>/dev/null || echo "")
else
    echo "🔍 No project context, trying generic listing..."
    # Fallback to generic listing
    DEPLOYMENTS=$(vercel ls --token=$VERCEL_TOKEN 2>/dev/null || echo "")
fi

if [ -z "$DEPLOYMENTS" ]; then
    echo "❌ ERROR: Could not list deployments. Project context may be missing."
    echo "   Try setting VERCEL_PROJECT_ID and VERCEL_ORG_ID environment variables."
    exit 1
fi

echo "📋 Found deployments:"
echo "$DEPLOYMENTS"

# Find the previous successful deployment (skip the latest which may have failed)
# Look for the second deployment in the list (index 1)
PREVIOUS_URL=$(echo "$DEPLOYMENTS" | awk 'NR==3 {print $2}')

if [ -z "$PREVIOUS_URL" ]; then
    echo "❌ ERROR: No previous deployment found to roll back to."
    echo "   This usually means there's only one deployment or the latest failed."
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