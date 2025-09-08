#!/bin/bash

# Automated Inngest sync using curl command
API_URL="https://adminer-api.vercel.app"
INNGEST_ENDPOINT="$API_URL/api/inngest"

echo "🔄 Syncing Inngest App with Curl"
echo "================================"
echo ""

echo "Using endpoint: $INNGEST_ENDPOINT"
echo ""

# Test the endpoint first
echo "1. Testing endpoint accessibility..."
if curl -s "$INNGEST_ENDPOINT" > /dev/null; then
    echo "✅ Endpoint is accessible"
else
    echo "❌ Endpoint not accessible"
    exit 1
fi

# Perform the sync
echo ""
echo "2. Performing sync..."
response=$(curl -s -X PUT "$INNGEST_ENDPOINT")

if echo "$response" | grep -q "success.*true"; then
    echo "✅ Sync successful!"
    app_id=$(echo "$response" | jq -r '.appId' 2>/dev/null)
    app_name=$(echo "$response" | jq -r '.appName' 2>/dev/null)
    functions_count=$(echo "$response" | jq -r '.functions | length' 2>/dev/null)
    
    echo "   App ID: $app_id"
    echo "   App Name: $app_name"
    echo "   Functions: $functions_count"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Go to Inngest Cloud Dashboard: https://app.inngest.com"
    echo "2. Look for app: $app_id"
    echo "3. Verify all $functions_count functions are listed"
    echo "4. Test job creation to ensure everything works"
else
    echo "❌ Sync failed"
    echo "Response: $response"
    exit 1
fi
