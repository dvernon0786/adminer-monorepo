#!/bin/bash

# Quick Inngest fix - just test the sync
API_URL="https://adminer-api.vercel.app"
INNGEST_ENDPOINT="$API_URL/api/inngest"

echo "🔄 Quick Inngest Sync Test"
echo "=========================="
echo ""

echo "Testing sync endpoint: $INNGEST_ENDPOINT"
response=$(curl -s -X PUT "$INNGEST_ENDPOINT")

if echo "$response" | grep -q "success.*true"; then
    echo "✅ Sync successful!"
    echo "App ID: $(echo "$response" | jq -r '.appId' 2>/dev/null)"
    echo "Functions: $(echo "$response" | jq -r '.functions | length' 2>/dev/null)"
    echo ""
    echo "🎯 Next step: Update Inngest Cloud dashboard to use this URL"
    echo "   URL: $INNGEST_ENDPOINT"
else
    echo "❌ Sync failed"
    echo "Response: $response"
    exit 1
fi
