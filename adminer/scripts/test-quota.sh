#!/bin/bash

# Test script for quota system endpoints
# This script tests the quota status and quota check endpoints

set -e

# Configuration
API_BASE_URL="http://localhost:3000"
QUOTA_STATUS_ENDPOINT="/api/consolidated?action=quota/status"
TEST_QUOTA_ENDPOINT="/api/test-quota"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing Quota System Endpoints${NC}"
echo "======================================"

# Test 1: Quota Status (requires auth)
echo -e "\n${YELLOW}Test 1: Quota Status Endpoint${NC}"
echo "Note: This requires authentication - you may need to be logged in"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_BASE_URL$QUOTA_STATUS_ENDPOINT")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Response Status: $HTTP_STATUS"
echo "Response Body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Test 1 PASSED (expected behavior)${NC}"
else
    echo -e "${RED}❌ Test 1 FAILED (unexpected status)${NC}"
fi

# Test 2: Test Quota Endpoint (requires auth)
echo -e "\n${YELLOW}Test 2: Test Quota Endpoint${NC}"
echo "Note: This requires authentication - you may need to be logged in"

# Test without job simulation
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_BASE_URL$TEST_QUOTA_ENDPOINT" \
  -H "Content-Type: application/json" \
  --data '{"orgId":"test-org-123"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Response Status: $HTTP_STATUS"
echo "Response Body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Test 2 PASSED (expected behavior)${NC}"
else
    echo -e "${RED}❌ Test 2 FAILED (unexpected status)${NC}"
fi

# Test 3: Test Quota Endpoint with Job Simulation (requires auth)
echo -e "\n${YELLOW}Test 3: Test Quota Endpoint with Job Simulation${NC}"
echo "Note: This requires authentication - you may need to be logged in"

# Test with job simulation
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_BASE_URL$TEST_QUOTA_ENDPOINT" \
  -H "Content-Type: application/json" \
  --data '{"orgId":"test-org-123","simulateJob":true}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Response Status: $HTTP_STATUS"
echo "Response Body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Test 3 PASSED (expected behavior)${NC}"
else
    echo -e "${RED}❌ Test 3 FAILED (unexpected status)${NC}"
fi

# Test 4: Health Check (public endpoint)
echo -e "\n${YELLOW}Test 4: Health Check Endpoint${NC}"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_BASE_URL/api/consolidated?action=health")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Response Status: $HTTP_STATUS"
echo "Response Body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Test 4 PASSED${NC}"
else
    echo -e "${RED}❌ Test 4 FAILED${NC}"
fi

echo -e "\n${YELLOW}🎯 Quota System Testing Complete${NC}"
echo "======================================"
echo -e "${GREEN}All tests completed. Check the results above.${NC}"
echo ""
echo "Next steps:"
echo "1. Log in to your application to test authenticated endpoints"
echo "2. Check your database for quota usage records"
echo "3. Test the upgrade flow when quota is exceeded"
echo "4. Monitor logs for any errors"
echo ""
echo "To test authenticated endpoints:"
echo "1. Start your development server: npm run dev"
echo "2. Log in to your application"
echo "3. Run this script again to see authenticated responses" 