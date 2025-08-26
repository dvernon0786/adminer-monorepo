#!/usr/bin/env bash
set -euo pipefail

# Post-Deploy Smoke Test Pack for ADminer
# Run this after deployment to validate everything works end-to-end

echo "🚀 ADminer Production Smoke Test"
echo "=================================="

# Default to production URL, but allow override
BASE_URL="${1:-https://www.adminer.online}"
echo "Testing: $BASE_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    local method="${4:-GET}"
    local data="${5:-}"
    
    echo -n "🧪 Testing $name... "
    
    if [ -n "$data" ]; then
        # POST request with data
        response=$(curl -s -w "%{http_code}" -X "$method" "$url" -H 'Content-Type: application/json' -d "$data" || echo "000")
    else
        # GET request
        response=$(curl -s -w "%{http_code}" "$url" || echo "000")
    fi
    
    # Extract status code (last 3 characters)
    status="${response: -3}"
    # Extract response body (everything except last 3 characters)
    body="${response%???}"
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($status)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (expected $expected_status, got $status)"
        echo "   Response: $body"
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "1️⃣  Testing Health Endpoint"
test_endpoint "Health Check" "$BASE_URL/api/consolidated?action=health" "200"

echo ""
echo "2️⃣  Testing SPA Serving"
test_endpoint "SPA Root" "$BASE_URL/" "200"

echo ""
echo "3️⃣  Testing Clerk-Protected Route (should 401 when signed out)"
test_endpoint "Quota Status (Protected)" "$BASE_URL/api/consolidated?action=quota/status" "401"

echo ""
echo "4️⃣  Testing Dodo Webhook Endpoint (should reject bad signature)"
test_endpoint "Dodo Webhook (Bad Signature)" "$BASE_URL/api/dodo/webhook" "400" "POST" '{}'

echo ""
echo "5️⃣  Testing Dodo Bootstrap Endpoint (should reject without auth)"
test_endpoint "Dodo Bootstrap (No Auth)" "$BASE_URL/api/billing/bootstrap-free" "401" "POST" '{"email":"test@example.com","name":"Test"}'

echo ""
echo "📊 Test Results"
echo "==============="
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All smoke tests passed! Production deployment is healthy.${NC}"
    exit 0
else
    echo -e "${RED}💥 Some smoke tests failed. Check the deployment.${NC}"
    exit 1
fi 