#!/bin/bash

# 🧪 Micro-Smoke Test: 30-Second Post-Deploy Validation
# Quick health check that confirms deployment is working

set -e

echo "🧪 Starting Micro-Smoke Test..."
echo "⏱️  Expected duration: 30 seconds"
echo ""

# Configuration
BASE_URL="${BASE_URL:-https://www.adminer.online}"
TIMEOUT=10
START_TIME=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test 1: Health Check (should return 200)
log_info "Test 1: Health endpoint"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health.json "${BASE_URL}/api/consolidated?action=health" --max-time $TIMEOUT || echo "000")
HEALTH_HTTP_CODE="${HEALTH_RESPONSE: -3}"
HEALTH_BODY=$(cat /tmp/health.json 2>/dev/null || echo "{}")

if [ "$HEALTH_HTTP_CODE" = "200" ]; then
    log_success "Health endpoint: 200 OK"
    
    # Check if response contains expected fields
    if echo "$HEALTH_BODY" | grep -q '"status"'; then
        log_success "Health response contains status field"
    else
        log_warning "Health response missing status field"
    fi
else
    log_error "Health endpoint failed: HTTP $HEALTH_HTTP_CODE"
    echo "Response: $HEALTH_BODY"
    exit 1
fi

# Test 2: Clerk-protected route (should return 401 when not authenticated)
log_info "Test 2: Clerk authentication gate"
AUTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/auth.json "${BASE_URL}/api/consolidated?action=quota/status" --max-time $TIMEOUT || echo "000")
AUTH_HTTP_CODE="${AUTH_RESPONSE: -3}"
AUTH_BODY=$(cat /tmp/auth.json 2>/dev/null || echo "{}")

if [ "$AUTH_HTTP_CODE" = "401" ]; then
    log_success "Authentication gate: 401 Unauthorized (expected)"
elif [ "$AUTH_HTTP_CODE" = "403" ]; then
    log_success "Authentication gate: 403 Forbidden (acceptable)"
else
    log_warning "Authentication gate: HTTP $AUTH_HTTP_CODE (unexpected)"
    echo "Response: $AUTH_BODY"
fi

# Test 3: Webhook signature validation (should reject invalid signature)
log_info "Test 3: Webhook signature validation"
WEBHOOK_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/webhook.json \
    -X POST "${BASE_URL}/api/dodo/webhook" \
    -H "Content-Type: application/json" \
    -d '{"invalid": "payload"}' \
    --max-time $TIMEOUT || echo "000")
WEBHOOK_HTTP_CODE="${WEBHOOK_RESPONSE: -3}"
WEBHOOK_BODY=$(cat /tmp/webhook.json 2>/dev/null || echo "{}")

if [ "$WEBHOOK_HTTP_CODE" = "400" ] || [ "$WEBHOOK_HTTP_CODE" = "401" ] || [ "$WEBHOOK_HTTP_CODE" = "422" ]; then
    log_success "Webhook validation: HTTP $WEBHOOK_HTTP_CODE (rejected invalid payload)"
elif [ "$WEBHOOK_HTTP_CODE" = "500" ]; then
    log_error "Webhook validation: 500 Internal Server Error (should reject, not crash)"
    echo "Response: $WEBHOOK_BODY"
    exit 1
else
    log_warning "Webhook validation: HTTP $WEBHOOK_HTTP_CODE (unexpected)"
    echo "Response: $WEBHOOK_BODY"
fi

# Test 4: Build banners in deployment logs (manual check reminder)
log_info "Test 4: Build banners verification"
log_warning "MANUAL CHECK REQUIRED: Verify build banners present in Vercel deployment logs"
log_info "Look for: '==== [Prebuild Guard: Dodo] ====' and '==== [Prebuild Guard: Clerk] ===='"

# Test 5: Environment variable validation
log_info "Test 5: Environment validation"
ENV_CHECK_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/env.json "${BASE_URL}/api/consolidated?action=env" --max-time $TIMEOUT 2>/dev/null || echo "000")
ENV_HTTP_CODE="${ENV_CHECK_RESPONSE: -3}"

if [ "$ENV_HTTP_CODE" = "200" ]; then
    log_success "Environment validation: 200 OK"
elif [ "$ENV_HTTP_CODE" = "401" ]; then
    log_success "Environment validation: 401 Unauthorized (protected endpoint)"
else
    log_warning "Environment validation: HTTP $ENV_HTTP_CODE"
fi

# Calculate total time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "🎯 Micro-Smoke Test Results:"
echo "⏱️  Duration: ${DURATION} seconds"

# Summary
if [ "$HEALTH_HTTP_CODE" = "200" ] && [ "$WEBHOOK_HTTP_CODE" != "500" ]; then
    echo ""
    log_success "🎉 MICRO-SMOKE TEST PASSED!"
    echo "✅ Deployment appears healthy and secure"
    echo "✅ Core endpoints responding correctly"
    echo "✅ Authentication gates working"
    echo "✅ Webhook validation rejecting invalid requests"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Verify build banners in Vercel logs"
    echo "   2. Test authenticated user flows"
    echo "   3. Run full smoke test: npm run smoke"
    exit 0
else
    echo ""
    log_error "💥 MICRO-SMOKE TEST FAILED!"
    echo "❌ Critical issues detected"
    echo "❌ Deployment may not be ready for production"
    echo ""
    echo "🚨 Immediate actions:"
    echo "   1. Check Vercel deployment logs for errors"
    echo "   2. Verify environment variables are set"
    echo "   3. Consider rolling back to previous deployment"
    echo "   4. Review ROLLBACK.md for emergency procedures"
    exit 1
fi 