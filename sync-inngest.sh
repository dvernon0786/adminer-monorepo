#!/bin/bash

# Automated Inngest sync script
API_URL="https://adminer-api.vercel.app"
INNGEST_ENDPOINT="$API_URL/api/inngest"

echo "🔄 Syncing Inngest with adminer-api..."

# Test endpoint first
if curl -s "$INNGEST_ENDPOINT" > /dev/null; then
    echo "✅ API endpoint is accessible"
    
    # Perform sync
    echo "🔄 Performing sync..."
    response=$(curl -s -X PUT "$INNGEST_ENDPOINT")
    
    if echo "$response" | grep -q "success.*true"; then
        echo "✅ Sync successful!"
        echo "Response: $response"
    else
        echo "❌ Sync failed"
        echo "Response: $response"
        exit 1
    fi
else
    echo "❌ API endpoint not accessible"
    exit 1
fi
