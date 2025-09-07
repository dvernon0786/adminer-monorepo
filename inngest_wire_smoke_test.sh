#!/bin/bash

echo "🔥 INNGEST WIRE SMOKE TEST - Phase 1 Immediate Testing"
echo "=============================================================="
echo ""

# Test 1: Frontend Accessibility
echo "1. Testing Frontend Accessibility..."
FRONTEND_URL="https://adminer-6wbglfv39-damiens-projects-98ddf0e8.vercel.app"
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$frontend_status" = "200" ]; then
    echo "✅ Frontend accessible: $FRONTEND_URL"
else
    echo "❌ Frontend not accessible: HTTP $frontend_status"
fi

# Test 2: API Health Check
echo ""
echo "2. Testing API Health..."
API_URL="https://adminer-896euqekf-damiens-projects-98ddf0e8.vercel.app"
PROTECTION_BYPASS_TOKEN="${PROTECTION_BYPASS_TOKEN:-}"
if [ -n "$PROTECTION_BYPASS_TOKEN" ]; then
    echo "Using protection bypass token for API calls..."
    api_health=$(curl -s -H "x-vercel-protection-bypass: $PROTECTION_BYPASS_TOKEN" "$API_URL/api/health")
else
    echo "No protection bypass token found, using direct API call..."
    api_health=$(curl -s "$API_URL/api/health")
fi
echo "API Health Response: $api_health"

# Test 3: Jobs API Endpoint
echo ""
echo "3. Testing Jobs API Endpoint..."
if [ -n "$PROTECTION_BYPASS_TOKEN" ]; then
    jobs_response=$(curl -s -H "x-vercel-protection-bypass: $PROTECTION_BYPASS_TOKEN" "$API_URL/api/jobs")
else
    jobs_response=$(curl -s "$API_URL/api/jobs")
fi
echo "Jobs API Response: $jobs_response"

# Test 4: Inngest Endpoint
echo ""
echo "4. Testing Inngest Endpoint..."
if [ -n "$PROTECTION_BYPASS_TOKEN" ]; then
    inngest_response=$(curl -s -H "x-vercel-protection-bypass: $PROTECTION_BYPASS_TOKEN" "$API_URL/api/inngest")
else
    inngest_response=$(curl -s "$API_URL/api/inngest")
fi
echo "Inngest Response: $inngest_response"

# Test 5: Create Test Job
echo ""
echo "5. Creating Test Job..."
if [ -n "$PROTECTION_BYPASS_TOKEN" ]; then
    job_creation=$(curl -s -X POST "$API_URL/api/jobs" \
      -H "Content-Type: application/json" \
      -H "x-vercel-protection-bypass: $PROTECTION_BYPASS_TOKEN" \
      -d '{
        "keyword": "Nike shoes",
        "limit": 5,
        "priority": "high"
      }')
else
    job_creation=$(curl -s -X POST "$API_URL/api/jobs" \
      -H "Content-Type: application/json" \
      -d '{
        "keyword": "Nike shoes",
        "limit": 5,
        "priority": "high"
      }')
fi
echo "Job Creation Response: $job_creation"

# Extract job ID if successful
job_id=$(echo "$job_creation" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
if [ -n "$job_id" ]; then
    echo "✅ Job created with ID: $job_id"
    
    # Test 6: Check Job Status
    echo ""
    echo "6. Checking Job Status..."
    sleep 2
    if [ -n "$PROTECTION_BYPASS_TOKEN" ]; then
        job_status=$(curl -s -H "x-vercel-protection-bypass: $PROTECTION_BYPASS_TOKEN" "$API_URL/api/jobs?jobId=$job_id")
    else
        job_status=$(curl -s "$API_URL/api/jobs?jobId=$job_id")
    fi
    echo "Job Status Response: $job_status"
else
    echo "❌ Failed to extract job ID from response"
fi

# Test 7: Database Connection Test
echo ""
echo "7. Testing Database Connection via API..."
if [ -n "$PROTECTION_BYPASS_TOKEN" ]; then
    db_test=$(curl -s -H "x-vercel-protection-bypass: $PROTECTION_BYPASS_TOKEN" "$API_URL/api/consolidated?action=health")
else
    db_test=$(curl -s "$API_URL/api/consolidated?action=health")
fi
echo "Database Health Response: $db_test"

# Test 8: Apify Integration Test
echo ""
echo "8. Testing Apify Integration..."
if [ -n "$PROTECTION_BYPASS_TOKEN" ]; then
    apify_health=$(curl -s -H "x-vercel-protection-bypass: $PROTECTION_BYPASS_TOKEN" "$API_URL/api/apify/health")
else
    apify_health=$(curl -s "$API_URL/api/apify/health")
fi
echo "Apify Health Response: $apify_health"

# Test 9: Environment Variables Check
echo ""
echo "9. Environment Variables Status..."
echo "Testing if critical environment variables are accessible..."

# Test if API can access environment variables
if [ -n "$PROTECTION_BYPASS_TOKEN" ]; then
    env_test=$(curl -s -H "x-vercel-protection-bypass: $PROTECTION_BYPASS_TOKEN" "$API_URL/api/consolidated?action=env-check" 2>/dev/null || echo "Endpoint not available")
else
    env_test=$(curl -s "$API_URL/api/consolidated?action=env-check" 2>/dev/null || echo "Endpoint not available")
fi
echo "Environment Check: $env_test"

# Test 10: Webhook Endpoints
echo ""
echo "10. Testing Webhook Endpoints..."
if [ -n "$PROTECTION_BYPASS_TOKEN" ]; then
    webhook_test=$(curl -s -X GET -H "x-vercel-protection-bypass: $PROTECTION_BYPASS_TOKEN" "$API_URL/api/webhook")
else
    webhook_test=$(curl -s -X GET "$API_URL/api/webhook")
fi
echo "Webhook Response: $webhook_test"

# Summary
echo ""
echo "=============================================================="
echo "🔥 SMOKE TEST SUMMARY"
echo "=============================================================="

# Analyze results
echo ""
echo "Component Status:"
if [ "$frontend_status" = "200" ]; then
    echo "✅ Frontend: WORKING"
else
    echo "❌ Frontend: FAILED"
fi

if echo "$api_health" | grep -q "success\|healthy\|ok" 2>/dev/null; then
    echo "✅ API Health: WORKING"
else
    echo "❌ API Health: FAILED"
fi

if echo "$jobs_response" | grep -q "success\|jobs" 2>/dev/null; then
    echo "✅ Jobs API: WORKING"
else
    echo "❌ Jobs API: FAILED"
fi

if echo "$inngest_response" | grep -q "success\|healthy\|inngest" 2>/dev/null; then
    echo "✅ Inngest Endpoint: WORKING"
else
    echo "❌ Inngest Endpoint: FAILED"
fi

if [ -n "$job_id" ]; then
    echo "✅ Job Creation: WORKING"
else
    echo "❌ Job Creation: FAILED"
fi

echo ""
echo "🎯 Next Steps Based on Results:"
echo "1. If all components show ✅ - Proceed with deeper integration testing"
echo "2. If any component shows ❌ - Debug specific failures before continuing"
echo "3. Monitor Vercel logs for Inngest event triggering"
echo "4. Check Inngest dashboard for job processing status"

echo ""
echo "🔍 Manual Testing Instructions:"
echo "1. Visit: $FRONTEND_URL"
echo "2. Navigate to dashboard and create a job"
echo "3. Monitor browser console for any errors"
echo "4. Check Vercel function logs for Inngest triggers"
echo "5. Verify in Inngest Cloud dashboard if events are received"

echo ""
echo "Smoke test completed! Check results above."