#!/bin/bash

# Dodo Integration Smoke Tests
# Run this after deploying to verify endpoints are working

set -e

BASE_URL="${1:-https://www.adminer.online}"
DODO_WEBHOOK_SECRET="${DODO_WEBHOOK_SECRET:-live_xxx}"

echo "🧪 Testing Dodo Integration at $BASE_URL"
echo "=========================================="

# Test 1: Health endpoint
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/consolidated?action=health")
if echo "$HEALTH_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Health endpoint working: $HEALTH_RESPONSE"
else
    echo "❌ Health endpoint failed: $HEALTH_RESPONSE"
    exit 1
fi

# Test 2: Quota endpoint (should return 401 without auth)
echo "2. Testing quota endpoint without auth..."
QUOTA_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/consolidated?action=quota/status")
HTTP_CODE="${QUOTA_RESPONSE: -3}"
RESPONSE_BODY="${QUOTA_RESPONSE%???}"

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Quota endpoint properly protected (401): $RESPONSE_BODY"
else
    echo "❌ Quota endpoint not properly protected (got $HTTP_CODE): $RESPONSE_BODY"
    exit 1
fi

# Test 3: Dodo webhook signature verification
echo "3. Testing Dodo webhook signature verification..."
BODY='{"type":"subscription.updated","orgId":"org_ci_smoke","plan":"pro"}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$DODO_WEBHOOK_SECRET" -r | cut -d' ' -f1)

WEBHOOK_RESPONSE=$(curl -s -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "dodo-signature: $SIG" \
    -d "$BODY" \
    "$BASE_URL/api/payments/webhook")

HTTP_CODE="${WEBHOOK_RESPONSE: -3}"
RESPONSE_BODY="${WEBHOOK_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Dodo webhook working with valid signature: $RESPONSE_BODY"
else
    echo "❌ Dodo webhook failed (got $HTTP_CODE): $RESPONSE_BODY"
    exit 1
fi

# Test 4: Dodo webhook with invalid signature
echo "4. Testing Dodo webhook with invalid signature..."
WEBHOOK_RESPONSE=$(curl -s -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "dodo-signature: invalid_signature" \
    -d "$BODY" \
    "$BASE_URL/api/payments/webhook")

HTTP_CODE="${WEBHOOK_RESPONSE: -3}"
RESPONSE_BODY="${WEBHOOK_RESPONSE%???}"

if [ "$HTTP_CODE" = "400" ]; then
    echo "✅ Dodo webhook properly rejects invalid signatures (400): $RESPONSE_BODY"
else
    echo "❌ Dodo webhook should reject invalid signatures (got $HTTP_CODE): $RESPONSE_BODY"
    exit 1
fi

echo ""
echo "🎉 All Dodo integration tests passed!"
echo "Your endpoints are ready for production use." 