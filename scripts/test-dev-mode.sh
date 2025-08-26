#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Testing Adminer API Endpoints in Development Mode"

# Test health endpoint (should work without auth)
echo "✅ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/consolidated?action=health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "   ✅ Health endpoint working"
else
    echo "   ❌ Health endpoint failed: $HEALTH_RESPONSE"
    exit 1
fi

# Test quota endpoint with Free plan (dev mode)
echo "✅ Testing quota endpoint - Free plan (dev mode)..."
QUOTA_RESPONSE=$(curl -s -H "x-dev-user-id: dev-user-123" -H "x-dev-org-id: dev-org-free" -H "x-dev-plan: free" \
    http://localhost:3000/api/consolidated?action=quota/status)
if echo "$QUOTA_RESPONSE" | grep -q '"plan":"free"' && echo "$QUOTA_RESPONSE" | grep -q '"perKeywordCap":10'; then
    echo "   ✅ Free plan quota working"
    echo "   Response: $QUOTA_RESPONSE"
else
    echo "   ❌ Free plan quota failed: $QUOTA_RESPONSE"
    exit 1
fi

# Test quota endpoint with Pro plan (dev mode)
echo "✅ Testing quota endpoint - Pro plan (dev mode)..."
QUOTA_RESPONSE=$(curl -s -H "x-dev-user-id: dev-user-456" -H "x-dev-org-id: dev-org-pro" -H "x-dev-plan: pro" \
    http://localhost:3000/api/consolidated?action=quota/status)
if echo "$QUOTA_RESPONSE" | grep -q '"plan":"pro"' && echo "$QUOTA_RESPONSE" | grep -q '"limit":500'; then
    echo "   ✅ Pro plan quota working"
    echo "   Response: $QUOTA_RESPONSE"
else
    echo "   ❌ Pro plan quota failed: $QUOTA_RESPONSE"
    exit 1
fi

# Test quota endpoint with Enterprise plan (dev mode)
echo "✅ Testing quota endpoint - Enterprise plan (dev mode)..."
QUOTA_RESPONSE=$(curl -s -H "x-dev-user-id: dev-user-789" -H "x-dev-org-id: dev-org-ent" -H "x-dev-plan: enterprise" \
    http://localhost:3000/api/consolidated?action=quota/status)
if echo "$QUOTA_RESPONSE" | grep -q '"plan":"enterprise"' && echo "$QUOTA_RESPONSE" | grep -q '"limit":2000'; then
    echo "   ✅ Enterprise plan quota working"
    echo "   Response: $QUOTA_RESPONSE"
else
    echo "   ❌ Enterprise plan quota failed: $QUOTA_RESPONSE"
    exit 1
fi

# Test jobs create endpoint with Free plan (dev mode)
echo "✅ Testing jobs create - Free plan (dev mode)..."
JOBS_RESPONSE=$(curl -s -X POST -H "x-dev-user-id: dev-user-123" -H "x-dev-org-id: dev-org-free" -H "x-dev-plan: free" \
    -H "Content-Type: application/json" \
    -d '{"keyword":"test keyword","limit":200}' \
    http://localhost:3000/api/jobs/create)
if echo "$JOBS_RESPONSE" | grep -q '"allowed":10' && echo "$JOBS_RESPONSE" | grep -q '"requested":200'; then
    echo "   ✅ Free plan job creation working (clamped to 10)"
    echo "   Response: $JOBS_RESPONSE"
else
    echo "   ❌ Free plan job creation failed: $JOBS_RESPONSE"
    exit 1
fi

# Test jobs create endpoint with Pro plan (dev mode)
echo "✅ Testing jobs create - Pro plan (dev mode)..."
JOBS_RESPONSE=$(curl -s -X POST -H "x-dev-user-id: dev-user-456" -H "x-dev-org-id: dev-org-pro" -H "x-dev-plan: pro" \
    -H "Content-Type: application/json" \
    -d '{"keyword":"test keyword","limit":100}' \
    http://localhost:3000/api/jobs/create)
if echo "$JOBS_RESPONSE" | grep -q '"allowed":100' && echo "$JOBS_RESPONSE" | grep -q '"requested":100'; then
    echo "   ✅ Pro plan job creation working"
    echo "   Response: $JOBS_RESPONSE"
else
    echo "   ❌ Pro plan job creation failed: $JOBS_RESPONSE"
    exit 1
fi

# Test webhook endpoint (should be accessible without auth)
echo "✅ Testing webhook endpoint accessibility..."
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:3000/api/dodo/webhook \
    -H "Content-Type: application/json" \
    -d '{"test":"data"}')
if echo "$WEBHOOK_RESPONSE" | grep -q '"error":"Missing signature"'; then
    echo "   ✅ Webhook endpoint accessible (400 for missing signature is expected)"
else
    echo "   ❌ Webhook endpoint should be accessible, got: $WEBHOOK_RESPONSE"
    exit 1
fi

echo ""
echo "🎉 All development mode tests passed!"
echo ""
echo "Your API is now working in development mode with mock authentication!"
echo "You can test all endpoints without needing real Clerk JWT tokens."
echo ""
echo "Next steps:"
echo "1. Test with smoke script: npm run smoke:local"
echo "2. Or test manually: scripts/smoke.sh"
echo "3. When ready for production, remove DEV_MODE=true and add real Clerk tokens" 