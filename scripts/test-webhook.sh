#!/bin/bash

# Test script for Dodo webhook endpoint
# This script simulates webhook calls to test the signature verification

set -e

# Configuration
API_BASE_URL="http://localhost:3000"
WEBHOOK_ENDPOINT="/api/dodo/webhook"
WEBHOOK_SECRET="${DODO_WEBHOOK_SECRET:-test_secret}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing Dodo Webhook Endpoint${NC}"
echo "=================================="

# Test 1: Subscription Created Event
echo -e "\n${YELLOW}Test 1: Subscription Created Event${NC}"
BODY='{"id":"evt_test_1","type":"subscription.created","data":{"customerId":"cust_123","subscriptionId":"sub_123","priceId":"price_pro_test","status":"active","currentPeriodEnd":"2025-09-01T00:00:00Z"}}'

# Generate signature
SIG=$(node -e "
const crypto = require('crypto');
const secret = process.env.DODO_WEBHOOK_SECRET || 'test_secret';
const body = '$BODY';
const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
console.log('v1=' + digest);
")

echo "Body: $BODY"
echo "Signature: $SIG"

# Make request
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_BASE_URL$WEBHOOK_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Dodo-Signature: $SIG" \
  --data "$BODY")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Response Status: $HTTP_STATUS"
echo "Response Body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Test 1 PASSED${NC}"
else
    echo -e "${RED}❌ Test 1 FAILED${NC}"
fi

# Test 2: Subscription Activated Event
echo -e "\n${YELLOW}Test 2: Subscription Activated Event${NC}"
BODY='{"id":"evt_test_2","type":"subscription.activated","data":{"customerId":"cust_123","subscriptionId":"sub_123","priceId":"price_pro_test","status":"active","currentPeriodEnd":"2025-09-01T00:00:00Z"}}'

# Generate signature
SIG=$(node -e "
const crypto = require('crypto');
const secret = process.env.DODO_WEBHOOK_SECRET || 'test_secret';
const body = '$BODY';
const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
console.log('v1=' + digest);
")

echo "Body: $BODY"
echo "Signature: $SIG"

# Make request
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_BASE_URL$WEBHOOK_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Dodo-Signature: $SIG" \
  --data "$BODY")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Response Status: $HTTP_STATUS"
echo "Response Body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Test 2 PASSED${NC}"
else
    echo -e "${RED}❌ Test 2 FAILED${NC}"
fi

# Test 3: Invalid Signature (should fail)
echo -e "\n${YELLOW}Test 3: Invalid Signature (should fail)${NC}"
BODY='{"id":"evt_test_3","type":"subscription.created","data":{"customerId":"cust_123","subscriptionId":"sub_123"}}'

# Use wrong signature
WRONG_SIG="v1=wrong_signature_here"

echo "Body: $BODY"
echo "Wrong Signature: $WRONG_SIG"

# Make request
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_BASE_URL$WEBHOOK_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Dodo-Signature: $WRONG_SIG" \
  --data "$BODY")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Response Status: $HTTP_STATUS"
echo "Response Body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" = "400" ]; then
    echo -e "${GREEN}✅ Test 3 PASSED (correctly rejected invalid signature)${NC}"
else
    echo -e "${RED}❌ Test 3 FAILED (should have rejected invalid signature)${NC}"
fi

# Test 4: Quota Status Check
echo -e "\n${YELLOW}Test 4: Quota Status Check${NC}"
echo "Note: This requires authentication - you may need to be logged in"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_BASE_URL/api/consolidated?action=quota/status")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Response Status: $HTTP_STATUS"
echo "Response Body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Test 4 PASSED (expected behavior)${NC}"
else
    echo -e "${RED}❌ Test 4 FAILED (unexpected status)${NC}"
fi

echo -e "\n${YELLOW}🎯 Webhook Testing Complete${NC}"
echo "=================================="
echo -e "${GREEN}All tests completed. Check the results above.${NC}"
echo ""
echo "Next steps:"
echo "1. Check your database for webhook events"
echo "2. Verify org records were created/updated"
echo "3. Test with real Dodo webhook signatures"
echo "4. Monitor logs for any errors" 