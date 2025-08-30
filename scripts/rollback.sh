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

# Check if we have the required project context
if [ -z "${VERCEL_PROJECT_ID:-}" ] || [ -z "${VERCEL_ORG_ID:-}" ]; then
    echo "❌ ERROR: VERCEL_PROJECT_ID and VERCEL_ORG_ID environment variables are required"
    echo "   These are needed for proper project context in the rollback script"
    exit 1
fi

echo "🔍 Using project context:"
echo "   VERCEL_PROJECT_ID: ${VERCEL_PROJECT_ID:0:8}..."
echo "   VERCEL_ORG_ID: ${VERCEL_ORG_ID:0:8}..."

# Remove current alias (non-interactive) with proper project context
echo "🗑️  Removing current alias..."
echo "y" | vercel alias rm $ALIAS --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID --cwd adminer/apps/api || true

# List deployments with proper project context using --cwd flag
echo "🔍 Listing deployments with project context..."
DEPLOYMENTS=$(vercel deployments ls --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID --cwd adminer/apps/api 2>/dev/null || echo "")

if [ -z "$DEPLOYMENTS" ]; then
    echo "❌ ERROR: Could not list deployments. Trying alternative approach..."
    # Fallback: try vercel ls with --cwd flag
    DEPLOYMENTS=$(vercel ls --token=$VERCEL_TOKEN --cwd adminer/apps/api 2>/dev/null || echo "")
fi

if [ -z "$DEPLOYMENTS" ]; then
    echo "❌ ERROR: Could not list deployments even with --cwd flag."
    echo "   Project context may still be missing or there's a deeper issue."
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

# Set alias to the previous deployment with proper project context
echo "🔗 Setting alias to previous deployment..."
vercel alias set "$PREVIOUS_URL" $ALIAS --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID --cwd adminer/apps/api

echo "✅ Successfully rolled back to $PREVIOUS_URL"
echo "🌐 $ALIAS now points to: $PREVIOUS_URL"
echo ""
echo "💡 Rollback complete! The site should be accessible again."
echo "   Next deployment will automatically update the alias." 