#!/bin/bash
set -e

echo "🔍 Checking Vercel deployment status and logs..."

# Check if VERCEL_TOKEN is set
if [ -z "${VERCEL_TOKEN:-}" ]; then
    echo "❌ ERROR: VERCEL_TOKEN environment variable is required"
    echo "   Set it with: export VERCEL_TOKEN=your_token_here"
    exit 1
fi

echo "📋 Recent deployments:"
vercel ls --token=$VERCEL_TOKEN --limit=5

echo ""
echo "🔍 To see detailed build logs:"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Find your 'adminer-monorepo' project"
echo "3. Click on the latest deployment"
echo "4. Look at the 'Build Logs' tab"
echo ""
echo "💡 The build logs will show:"
echo "   - ls -la (root directory contents)"
echo "   - ls -la adminer/ (adminer subdirectory contents)"
echo "   - Where the cd command fails"
echo ""
echo "🎯 This will reveal the actual CI directory structure!" 