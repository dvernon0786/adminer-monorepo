#!/bin/bash

# Automated Inngest sync testing script
API_URL="https://adminer-api.vercel.app"
INNGEST_ENDPOINT="$API_URL/api/inngest"

echo "🧪 Testing Inngest Sync..."
echo "========================="
echo ""

# Test 1: Health Check
echo "1. Testing health check..."
if curl -s "$INNGEST_ENDPOINT" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Test 2: Sync Test
echo ""
echo "2. Testing sync endpoint..."
response=$(curl -s -X PUT "$INNGEST_ENDPOINT")
if echo "$response" | grep -q "success.*true"; then
    echo "✅ Sync test passed"
    echo "Functions found:"
    echo "$response" | jq -r '.functions[]?.id' 2>/dev/null || echo "Could not parse functions"
else
    echo "❌ Sync test failed"
    echo "Response: $response"
    exit 1
fi

# Test 3: Job Creation Test
echo ""
echo "3. Testing job creation..."
job_response=$(curl -s -X POST "$API_URL/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"test keyword","limit":5}')
if echo "$job_response" | grep -q "success.*true"; then
    echo "✅ Job creation test passed"
    job_id=$(echo "$job_response" | jq -r '.data.jobId' 2>/dev/null)
    echo "Job ID: $job_id"
else
    echo "❌ Job creation test failed"
    echo "Response: $job_response"
fi

echo ""
echo "🎉 All tests completed!"
