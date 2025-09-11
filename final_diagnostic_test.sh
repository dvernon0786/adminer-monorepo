#!/bin/bash

# Final comprehensive diagnostic test before moving to next stage
# Verifies all components are perfectly wired and production-ready

set -e

echo "FINAL PRE-PRODUCTION DIAGNOSTIC TEST"
echo "===================================="
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
TOTAL_TESTS=0

test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$1" = "PASS" ]; then
        print_status "$2"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        print_error "$2"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo "TEST SUITE 1: WEB APPLICATION VERIFICATION"
echo "=========================================="

# Test 1: Main web app
print_info "Testing main web application..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.adminer.online/ 2>/dev/null || echo "FAILED")
if [ "$WEB_STATUS" = "200" ]; then
    test_result "PASS" "Web app accessible at www.adminer.online"
else
    test_result "FAIL" "Web app not accessible (Status: $WEB_STATUS)"
fi

# Test 2: Web app content type
WEB_CONTENT=$(curl -s https://www.adminer.online/ | head -c 100)
if [[ $WEB_CONTENT == *"<html"* ]] || [[ $WEB_CONTENT == *"<!DOCTYPE"* ]]; then
    test_result "PASS" "Web app serves HTML content correctly"
else
    test_result "FAIL" "Web app not serving expected HTML content"
fi

echo ""
echo "TEST SUITE 2: API ENDPOINT VERIFICATION"
echo "======================================="

# API endpoints to test
API_ENDPOINTS=("test" "inngest" "health")

for endpoint in "${API_ENDPOINTS[@]}"; do
    print_info "Testing /api/$endpoint endpoint..."
    
    # Test via proxy (www.adminer.online)
    PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.adminer.online/api/$endpoint 2>/dev/null || echo "FAILED")
    PROXY_RESPONSE=$(curl -s https://www.adminer.online/api/$endpoint 2>/dev/null || echo "")
    
    if [ "$PROXY_STATUS" = "200" ] && [[ $PROXY_RESPONSE == *"{"* ]] && [[ $PROXY_RESPONSE == *"}"* ]]; then
        test_result "PASS" "API $endpoint working via proxy (www.adminer.online)"
    else
        test_result "FAIL" "API $endpoint not working via proxy (Status: $PROXY_STATUS)"
    fi
    
    # Test direct API (adminer-api-fixed.vercel.app)
    DIRECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://adminer-api-fixed.vercel.app/api/$endpoint 2>/dev/null || echo "FAILED")
    DIRECT_RESPONSE=$(curl -s https://adminer-api-fixed.vercel.app/api/$endpoint 2>/dev/null || echo "")
    
    if [ "$DIRECT_STATUS" = "200" ] && [[ $DIRECT_RESPONSE == *"{"* ]] && [[ $DIRECT_RESPONSE == *"}"* ]]; then
        test_result "PASS" "API $endpoint working via direct URL"
    else
        test_result "FAIL" "API $endpoint not working via direct URL (Status: $DIRECT_STATUS)"
    fi
done

echo ""
echo "TEST SUITE 3: HTTP METHOD VERIFICATION"
echo "======================================"

# Test different HTTP methods on inngest endpoint
print_info "Testing HTTP methods on /api/inngest..."

# GET method
GET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET https://www.adminer.online/api/inngest 2>/dev/null || echo "FAILED")
if [ "$GET_STATUS" = "200" ]; then
    test_result "PASS" "Inngest endpoint accepts GET requests"
else
    test_result "FAIL" "Inngest endpoint rejects GET requests (Status: $GET_STATUS)"
fi

# POST method
POST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://www.adminer.online/api/inngest -H "Content-Type: application/json" -d '{"test": "data"}' 2>/dev/null || echo "FAILED")
if [ "$POST_STATUS" = "200" ]; then
    test_result "PASS" "Inngest endpoint accepts POST requests"
else
    test_result "FAIL" "Inngest endpoint rejects POST requests (Status: $POST_STATUS)"
fi

# OPTIONS method (CORS)
OPTIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS https://www.adminer.online/api/test 2>/dev/null || echo "FAILED")
if [ "$OPTIONS_STATUS" = "200" ]; then
    test_result "PASS" "CORS OPTIONS requests working"
else
    test_result "FAIL" "CORS OPTIONS requests failing (Status: $OPTIONS_STATUS)"
fi

echo ""
echo "TEST SUITE 4: RESPONSE FORMAT VERIFICATION"
echo "=========================================="

print_info "Verifying response formats and headers..."

# Test content-type headers
CONTENT_TYPE=$(curl -s -I https://www.adminer.online/api/test | grep -i "content-type" | head -1)
if [[ $CONTENT_TYPE == *"application/json"* ]]; then
    test_result "PASS" "API returns correct Content-Type: application/json"
else
    test_result "FAIL" "API not returning correct Content-Type header"
fi

# Test CORS headers
CORS_HEADER=$(curl -s -I https://www.adminer.online/api/test | grep -i "access-control-allow-origin" | head -1)
if [[ $CORS_HEADER == *"*"* ]]; then
    test_result "PASS" "CORS headers configured correctly"
else
    test_result "FAIL" "CORS headers missing or incorrect"
fi

# Test JSON response structure
TEST_RESPONSE=$(curl -s https://www.adminer.online/api/test)
if [[ $TEST_RESPONSE == *"timestamp"* ]] && [[ $TEST_RESPONSE == *"message"* ]]; then
    test_result "PASS" "API responses contain expected fields"
else
    test_result "FAIL" "API responses missing expected fields"
fi

echo ""
echo "TEST SUITE 5: PERFORMANCE AND RELIABILITY"
echo "========================================="

print_info "Testing performance and reliability..."

# Test response time
START_TIME=$(date +%s%N)
curl -s https://www.adminer.online/api/test > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 )) # Convert to milliseconds

if [ $RESPONSE_TIME -lt 5000 ]; then
    test_result "PASS" "API response time acceptable (${RESPONSE_TIME}ms)"
else
    test_result "FAIL" "API response time too slow (${RESPONSE_TIME}ms)"
fi

# Test multiple rapid requests
print_info "Testing rapid consecutive requests..."
RAPID_FAILURES=0
for i in {1..5}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.adminer.online/api/test 2>/dev/null || echo "FAILED")
    if [ "$STATUS" != "200" ]; then
        RAPID_FAILURES=$((RAPID_FAILURES + 1))
    fi
done

if [ $RAPID_FAILURES -eq 0 ]; then
    test_result "PASS" "API handles rapid consecutive requests"
else
    test_result "FAIL" "API failed $RAPID_FAILURES out of 5 rapid requests"
fi

echo ""
echo "TEST SUITE 6: ARCHITECTURE VERIFICATION"
echo "======================================="

print_info "Verifying deployment architecture..."

# Test that proxy routing works
PROXY_RESPONSE=$(curl -s https://www.adminer.online/api/test)
DIRECT_RESPONSE=$(curl -s https://adminer-api-fixed.vercel.app/api/test)

# Compare key fields (both should have success and timestamp)
if [[ $PROXY_RESPONSE == *"success"* ]] && [[ $DIRECT_RESPONSE == *"success"* ]]; then
    test_result "PASS" "Proxy routing correctly forwards to API project"
else
    test_result "FAIL" "Proxy routing not working correctly"
fi

# Test that web app and API are separate projects
WEB_HEADERS=$(curl -s -I https://www.adminer.online/ | grep -i "x-vercel")
API_HEADERS=$(curl -s -I https://adminer-api-fixed.vercel.app/api/test | grep -i "x-vercel")

if [[ $WEB_HEADERS != $API_HEADERS ]]; then
    test_result "PASS" "Web app and API are separate Vercel projects"
else
    test_result "FAIL" "Web app and API appear to be on same project"
fi

echo ""
echo "FINAL DIAGNOSTIC RESULTS"
echo "========================"

echo ""
print_info "TEST SUMMARY:"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"

PASS_PERCENTAGE=$(( PASS_COUNT * 100 / TOTAL_TESTS ))
echo "Success Rate: $PASS_PERCENTAGE%"

echo ""
if [ $FAIL_COUNT -eq 0 ]; then
    print_status "ALL TESTS PASSED - READY FOR PRODUCTION"
    echo ""
    echo "PRODUCTION READINESS CHECKLIST:"
    echo "✅ Web application accessible and serving content"
    echo "✅ API endpoints responding with valid JSON"
    echo "✅ Proxy routing working between web app and API"
    echo "✅ CORS headers configured correctly"
    echo "✅ Multiple HTTP methods supported"
    echo "✅ Response times acceptable"
    echo "✅ Architecture properly separated"
    echo ""
    echo "READY FOR NEXT STAGE: Inngest Integration"
    echo ""
    echo "RECOMMENDED INNGEST WEBHOOK URLS:"
    echo "Primary: https://www.adminer.online/api/inngest"
    echo "Backup:  https://adminer-api-fixed.vercel.app/api/inngest"
    
elif [ $PASS_PERCENTAGE -ge 90 ]; then
    print_warning "MOSTLY READY - Minor issues detected ($FAIL_COUNT failures)"
    echo ""
    echo "Consider addressing the failed tests before production deployment."
    
else
    print_error "NOT READY FOR PRODUCTION - Significant issues detected"
    echo ""
    echo "Please address the failed tests before proceeding to next stage."
fi

echo ""
echo "DIAGNOSTIC COMPLETE"
echo "=================="