#!/bin/bash

# Verify Inngest sync status
API_URL="https://adminer-api.vercel.app"
INNGEST_ENDPOINT="$API_URL/api/inngest"

echo "🔍 Verifying Inngest Sync Status"
echo "==============================="
echo ""

# Test 1: Health Check
echo "1. Health Check..."
if curl -s "$INNGEST_ENDPOINT" > /dev/null; then
    echo "✅ API endpoint accessible"
else
    echo "❌ API endpoint not accessible"
    exit 1
fi

# Test 2: Sync Test
echo ""
echo "2. Sync Test..."
response=$(curl -s -X PUT "$INNGEST_ENDPOINT")
if echo "$response" | grep -q "success.*true"; then
    echo "✅ Sync endpoint working"
    app_id=$(echo "$response" | jq -r '.appId' 2>/dev/null)
    functions_count=$(echo "$response" | jq -r '.functions | length' 2>/dev/null)
    echo "   App ID: $app_id"
    echo "   Functions: $functions_count"
else
    echo "❌ Sync endpoint failed"
    echo "   Response: $response"
    exit 1
fi

# Test 3: Job Creation
echo ""
echo "3. Job Creation Test..."
job_response=$(curl -s -X POST "$API_URL/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"sync test","limit":3}')
if echo "$job_response" | grep -q "success.*true"; then
    echo "✅ Job creation working"
    job_id=$(echo "$job_response" | jq -r '.data.jobId' 2>/dev/null)
    echo "   Job ID: $job_id"
else
    echo "❌ Job creation failed"
    echo "   Response: $job_response"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Go to Inngest Cloud Dashboard: https://app.inngest.com"
echo "2. Create/update app with sync URL: $INNGEST_ENDPOINT"
echo "3. Wait 1-2 minutes for sync to complete"
echo "4. Verify functions appear in dashboard"
echo ""
echo "📋 Sync URL: $INNGEST_ENDPOINT"
