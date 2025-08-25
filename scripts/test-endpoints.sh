#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Testing Adminer API Endpoints (Local Development)"

# Test health endpoint (should work without auth)
echo "✅ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/consolidated?action=health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "   ✅ Health endpoint working"
else
    echo "   ❌ Health endpoint failed: $HEALTH_RESPONSE"
    exit 1
fi

# Test quota endpoint without auth (should return 401)
echo "✅ Testing quota endpoint without auth..."
QUOTA_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/consolidated?action=quota/status)
HTTP_CODE="${QUOTA_RESPONSE: -3}"
RESPONSE_BODY="${QUOTA_RESPONSE%???}"
if [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Quota endpoint properly protected (401)"
else
    echo "   ❌ Quota endpoint should return 401, got $HTTP_CODE"
    echo "   Response: $RESPONSE_BODY"
    exit 1
fi

# Test jobs create endpoint without auth (should return 401)
echo "✅ Testing jobs create endpoint without auth..."
JOBS_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/jobs/create \
    -H "Content-Type: application/json" \
    -d '{"keyword":"test","limit":5}')
HTTP_CODE="${JOBS_RESPONSE: -3}"
RESPONSE_BODY="${JOBS_RESPONSE%???}"
if [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Jobs create endpoint properly protected (401)"
else
    echo "   ❌ Jobs create endpoint should return 401, got $HTTP_CODE"
    echo "   Response: $RESPONSE_BODY"
    exit 1
fi

# Test webhook endpoint (should be accessible without auth)
echo "✅ Testing webhook endpoint accessibility..."
WEBHOOK_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/dodo/webhook \
    -H "Content-Type: application/json" \
    -d '{"test":"data"}')
HTTP_CODE="${WEBHOOK_RESPONSE: -3}"
RESPONSE_BODY="${WEBHOOK_RESPONSE%???}"
if [ "$HTTP_CODE" = "400" ]; then
    echo "   ✅ Webhook endpoint accessible (400 for missing signature is expected)"
else
    echo "   ❌ Webhook endpoint should be accessible, got $HTTP_CODE"
    echo "   Response: $RESPONSE_BODY"
    exit 1
fi

echo ""
echo "🎉 All endpoint tests passed!"
echo ""
echo "Next steps:"
echo "1. Set up Clerk JWT tokens in scripts/smoke-local.env"
echo "2. Run: npm run smoke:local"
echo "3. Or test manually with: scripts/smoke.sh" 