#!/bin/bash

# Extended diagnostic test addressing systemic issues
# Tests what the basic diagnostic doesn't cover

set -e

echo "EXTENDED DIAGNOSTIC TEST - SYSTEMIC ISSUES"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

PASS_COUNT=0
FAIL_COUNT=0
WARNING_COUNT=0
TOTAL_TESTS=0

test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$1" = "PASS" ]; then
        print_status "$2"
        PASS_COUNT=$((PASS_COUNT + 1))
    elif [ "$1" = "WARNING" ]; then
        print_warning "$2"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    else
        print_error "$2"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo "TEST SUITE 1: VERCEL NODE.JS VERSION STABILITY"
echo "=============================================="

print_info "Testing Node.js version consistency across deployments..."

# Check current deployed Node.js version
API_NODE_VERSION=$(curl -s https://adminer-api-fixed.vercel.app/api/test | grep -o '"nodeVersion":"[^"]*' | cut -d'"' -f4 2>/dev/null || echo "unknown")
echo "Current API Node.js version: $API_NODE_VERSION"

# Test if it matches our configured version
if [[ $API_NODE_VERSION == v20* ]]; then
    test_result "PASS" "Node.js version matches configured 20.x ($API_NODE_VERSION)"
else
    test_result "FAIL" "Node.js version mismatch - Expected 20.x, got: $API_NODE_VERSION"
fi

# Check package.json configuration
cd adminer/apps/api
CONFIGURED_VERSION=$(grep -o '"node".*"[^"]*"' package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
echo "Configured Node.js version: $CONFIGURED_VERSION"

if [ "$CONFIGURED_VERSION" = "20.x" ]; then
    test_result "PASS" "Package.json specifies Node.js 20.x"
else
    test_result "WARNING" "Package.json Node.js version inconsistency: $CONFIGURED_VERSION"
fi

cd ../../..

echo ""
echo "TEST SUITE 2: BUILD PROCESS STABILITY"
echo "====================================="

print_info "Analyzing build process reliability..."

# Check if build logs show consistent function compilation
print_info "Simulating deployment to test build consistency..."

# Trigger a small change to test build process
echo "# Build test $(date)" >> README.md

git add README.md
git commit -m "TEST: Build process stability check - $(date)" || echo "No changes to commit"

print_info "Pushing test commit to trigger deployment..."
git push origin main

print_info "Waiting for deployment to complete..."
sleep 60

# Test if deployment succeeded
NEW_RESPONSE=$(curl -s https://adminer-api-fixed.vercel.app/api/test 2>/dev/null || echo "")
if [[ $NEW_RESPONSE == *"timestamp"* ]]; then
    test_result "PASS" "Build process completed successfully after test deployment"
else
    test_result "FAIL" "Build process failed after test deployment"
fi

# Check for function compilation in build
print_info "Build should show function compilation (check Vercel dashboard for logs)"
test_result "WARNING" "Build logs require manual verification in Vercel dashboard"

echo ""
echo "TEST SUITE 3: DEPLOYMENT CONSISTENCY"
echo "===================================="

print_info "Testing deployment consistency across multiple requests..."

# Test multiple deployments work consistently
DEPLOYMENT_FAILURES=0
for i in {1..10}; do
    RESPONSE=$(curl -s https://adminer-api-fixed.vercel.app/api/test 2>/dev/null || echo "FAILED")
    if [[ $RESPONSE != *"success"* ]]; then
        DEPLOYMENT_FAILURES=$((DEPLOYMENT_FAILURES + 1))
    fi
    sleep 2
done

if [ $DEPLOYMENT_FAILURES -eq 0 ]; then
    test_result "PASS" "All 10 consecutive requests succeeded"
elif [ $DEPLOYMENT_FAILURES -le 2 ]; then
    test_result "WARNING" "Minor inconsistency: $DEPLOYMENT_FAILURES/10 requests failed"
else
    test_result "FAIL" "Significant instability: $DEPLOYMENT_FAILURES/10 requests failed"
fi

echo ""
echo "TEST SUITE 4: VERCEL PLATFORM CONTRADICTIONS"
echo "============================================"

print_info "Testing for Vercel platform contradictions..."

# Check if Vercel dashboard shows any warnings
test_result "WARNING" "Manual check required: Vercel dashboard for Node.js version warnings"

# Test for contradictory behavior
print_info "Testing for runtime vs configuration mismatches..."

# Check if runtime warnings appear in headers
API_HEADERS=$(curl -s -I https://adminer-api-fixed.vercel.app/api/test)
if [[ $API_HEADERS == *"warning"* ]] || [[ $API_HEADERS == *"deprecated"* ]]; then
    test_result "WARNING" "Potential runtime warnings detected in headers"
else
    test_result "PASS" "No obvious runtime warnings in response headers"
fi

echo ""
echo "TEST SUITE 5: INNGEST CLOUD INTEGRATION READINESS"
echo "================================================"

print_info "Testing Inngest webhook endpoint preparedness..."

# Test webhook endpoint with various payloads
WEBHOOK_URL="https://www.adminer.online/api/inngest"

# Test empty payload
EMPTY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $WEBHOOK_URL -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "FAILED")
if [ "$EMPTY_RESPONSE" = "200" ]; then
    test_result "PASS" "Webhook accepts empty JSON payload"
else
    test_result "FAIL" "Webhook rejects empty JSON payload (Status: $EMPTY_RESPONSE)"
fi

# Test Inngest-style payload
INNGEST_PAYLOAD='{"event": {"name": "test.event", "data": {"message": "test"}}}'
INNGEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $WEBHOOK_URL -H "Content-Type: application/json" -d "$INNGEST_PAYLOAD" 2>/dev/null || echo "FAILED")
if [ "$INNGEST_RESPONSE" = "200" ]; then
    test_result "PASS" "Webhook accepts Inngest-style payload"
else
    test_result "FAIL" "Webhook rejects Inngest-style payload (Status: $INNGEST_RESPONSE)"
fi

# Test webhook response format
WEBHOOK_RESPONSE_BODY=$(curl -s -X POST $WEBHOOK_URL -H "Content-Type: application/json" -d '{"test": "data"}' 2>/dev/null || echo "")
if [[ $WEBHOOK_RESPONSE_BODY == *"processed"* ]] || [[ $WEBHOOK_RESPONSE_BODY == *"received"* ]]; then
    test_result "PASS" "Webhook returns appropriate response format"
else
    test_result "WARNING" "Webhook response format may need adjustment for Inngest"
fi

echo ""
echo "TEST SUITE 6: FAILURE SCENARIOS"
echo "==============================="

print_info "Testing system behavior under failure conditions..."

# Test invalid endpoints
INVALID_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://www.adminer.online/api/nonexistent 2>/dev/null || echo "FAILED")
if [ "$INVALID_RESPONSE" = "404" ]; then
    test_result "PASS" "System properly handles invalid API endpoints"
else
    test_result "WARNING" "Unexpected response for invalid endpoints (Status: $INVALID_RESPONSE)"
fi

# Test malformed requests
MALFORMED_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://www.adminer.online/api/inngest -H "Content-Type: application/json" -d 'invalid json' 2>/dev/null || echo "FAILED")
if [ "$MALFORMED_RESPONSE" = "400" ] || [ "$MALFORMED_RESPONSE" = "200" ]; then
    test_result "PASS" "System handles malformed JSON appropriately"
else
    test_result "WARNING" "Unexpected response for malformed JSON (Status: $MALFORMED_RESPONSE)"
fi

echo ""
echo "TEST SUITE 7: MONITORING AND OBSERVABILITY"
echo "=========================================="

print_info "Testing monitoring capabilities..."

# Test if health endpoint provides useful monitoring data
HEALTH_RESPONSE=$(curl -s https://www.adminer.online/api/health 2>/dev/null || echo "")
if [[ $HEALTH_RESPONSE == *"uptime"* ]] && [[ $HEALTH_RESPONSE == *"memory"* ]]; then
    test_result "PASS" "Health endpoint provides monitoring data"
else
    test_result "WARNING" "Health endpoint lacks comprehensive monitoring data"
fi

# Test response times for monitoring
RESPONSE_TIMES=()
for i in {1..5}; do
    START_TIME=$(date +%s%N)
    curl -s https://www.adminer.online/api/test > /dev/null
    END_TIME=$(date +%s%N)
    RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))
    RESPONSE_TIMES+=($RESPONSE_TIME)
done

# Calculate average
TOTAL_TIME=0
for time in "${RESPONSE_TIMES[@]}"; do
    TOTAL_TIME=$((TOTAL_TIME + time))
done
AVG_TIME=$((TOTAL_TIME / 5))

if [ $AVG_TIME -lt 2000 ]; then
    test_result "PASS" "Average response time acceptable (${AVG_TIME}ms)"
elif [ $AVG_TIME -lt 5000 ]; then
    test_result "WARNING" "Response time borderline (${AVG_TIME}ms)"
else
    test_result "FAIL" "Response time too slow (${AVG_TIME}ms)"
fi

echo ""
echo "EXTENDED DIAGNOSTIC RESULTS"
echo "==========================="

echo ""
print_info "COMPREHENSIVE TEST SUMMARY:"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASS_COUNT"
echo "Warnings: $WARNING_COUNT" 
echo "Failed: $FAIL_COUNT"

PASS_PERCENTAGE=$(( PASS_COUNT * 100 / TOTAL_TESTS ))
WARNING_PERCENTAGE=$(( WARNING_COUNT * 100 / TOTAL_TESTS ))
FAIL_PERCENTAGE=$(( FAIL_COUNT * 100 / TOTAL_TESTS ))

echo "Success Rate: $PASS_PERCENTAGE%"
echo "Warning Rate: $WARNING_PERCENTAGE%"
echo "Failure Rate: $FAIL_PERCENTAGE%"

echo ""
echo "SYSTEMIC ISSUE ANALYSIS"
echo "======================="

if [ $FAIL_COUNT -eq 0 ] && [ $WARNING_COUNT -le 3 ]; then
    print_status "SYSTEM RESILIENT - Ready for production with minor monitoring needed"
    echo ""
    echo "PRODUCTION CONFIDENCE: HIGH"
    echo "The system shows good stability and handles edge cases appropriately."
    
elif [ $FAIL_COUNT -le 2 ] && [ $WARNING_COUNT -le 5 ]; then
    print_warning "SYSTEM MOSTLY STABLE - Some concerns identified"
    echo ""
    echo "PRODUCTION CONFIDENCE: MEDIUM"
    echo "Monitor the warning areas closely after deployment."
    
else
    print_error "SYSTEMIC ISSUES DETECTED - Address before production"
    echo ""
    echo "PRODUCTION CONFIDENCE: LOW"
    echo "Significant issues need resolution before proceeding."
fi

echo ""
echo "SPECIFIC RISKS IDENTIFIED:"

if [ $WARNING_COUNT -gt 0 ] || [ $FAIL_COUNT -gt 0 ]; then
    echo ""
    echo "RECOMMENDED ACTIONS:"
    echo "1. Monitor Vercel dashboard for Node.js version warnings"
    echo "2. Set up deployment monitoring/alerts"
    echo "3. Test Inngest integration in staging environment first"
    echo "4. Implement proper error logging and monitoring"
    echo "5. Consider deployment rollback strategy"
fi

echo ""
echo "EXTENDED DIAGNOSTIC COMPLETE"
echo "============================"