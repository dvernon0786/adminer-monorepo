#!/usr/bin/env bash
# test-apify-e2e.sh - Test Apify end-to-end integration
set -euo pipefail

DOMAIN="${1:-https://www.adminer.online}"
CLERK_TOKEN="${CLERK_TOKEN:-}"

if [ -z "$CLERK_TOKEN" ]; then
  echo "❌ CLERK_TOKEN environment variable required"
  echo "Usage: CLERK_TOKEN=your_token ./scripts/test-apify-e2e.sh [domain]"
  exit 1
fi

echo "🧪 Testing Apify end-to-end integration"
echo "Domain: $DOMAIN"
echo ""

# Step 1: Create a job
echo "1️⃣ Creating test job..."
job_response=$(curl -s \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"test-apify-integration","limit":5}' \
  "$DOMAIN/api/jobs/start")

echo "Job creation response: $job_response"

# Extract job ID from response
job_id=$(echo "$job_response" | jq -r '.id // empty')
if [ -z "$job_id" ]; then
  echo "❌ Failed to get job ID from response"
  exit 1
fi

echo "✅ Job created with ID: $job_id"
echo ""

# Step 2: Check job status
echo "2️⃣ Checking job status..."
sleep 2

job_status=$(curl -s \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  "$DOMAIN/api/jobs/$job_id")

echo "Job status: $job_status"

status=$(echo "$job_status" | jq -r '.status // empty')
echo "Current status: $status"
echo ""

# Step 3: Monitor job progress
echo "3️⃣ Monitoring job progress..."
echo "Expected flow: queued → running → completed"
echo ""

for i in {1..30}; do
  echo "Check $i/30:"
  
  current_status=$(curl -s \
    -H "Authorization: Bearer $CLERK_TOKEN" \
    "$DOMAIN/api/jobs/$job_id" | jq -r '.status // empty')
  
  echo "  Status: $current_status"
  
  if [ "$current_status" = "completed" ]; then
    echo "  ✅ Job completed successfully!"
    
    # Check if analysis data is populated
    analysis_data=$(curl -s \
      -H "Authorization: Bearer $CLERK_TOKEN" \
      "$DOMAIN/api/jobs/$job_id" | jq -r '.analysis // empty')
    
    if [ "$analysis_data" != "null" ] && [ "$analysis_data" != "" ]; then
      echo "  ✅ Analysis data populated"
    else
      echo "  ⚠️ Analysis data not yet populated"
    fi
    
    break
  elif [ "$current_status" = "failed" ]; then
    echo "  ❌ Job failed"
    break
  elif [ "$current_status" = "running" ]; then
    echo "  🔄 Job is running..."
  else
    echo "  ⏳ Job is queued..."
  fi
  
  echo ""
  sleep 5
done

echo "🎯 Apify end-to-end test completed"
echo ""
echo "Next steps:"
echo "1. Check job details in dashboard"
echo "2. Verify rawData is populated"
echo "3. Check analysis columns (summary, keyInsights, etc.)"
echo "4. Verify contentType detection (text, image+text, text+video)" 