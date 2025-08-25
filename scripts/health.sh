#!/usr/bin/env bash
set -euo pipefail

# Health check script for CI
# This script checks the health endpoint of the production application

# Default values
PROD_URL="${PROD_URL:-}"
HEALTH_PATH="${HEALTH_PATH:-/api/consolidated?action=health}"

# Validate PROD_URL
if [ -z "$PROD_URL" ]; then
    echo "❌ PROD_URL environment variable is not set" >&2
    exit 1
fi

# Construct full health URL
HEALTH_URL="${PROD_URL%/}${HEALTH_PATH}"
echo "🔍 Checking health at: $HEALTH_URL"

# Perform health check
echo "📡 Sending health check request..."
RESPONSE=$(curl -sS -w "\nHTTP_STATUS:%{http_code}\nTOTAL_TIME:%{time_total}s" "$HEALTH_URL" || true)

# Extract response body and status
BODY=$(echo "$RESPONSE" | head -n -2)
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
TOTAL_TIME=$(echo "$RESPONSE" | grep "TOTAL_TIME:" | cut -d: -f2)

echo "📊 Health Check Results:"
echo "   Status: HTTP $HTTP_STATUS"
echo "   Response Time: ${TOTAL_TIME}s"
echo "   Response Body: $BODY"

# Check if health check passed
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check PASSED - Application is healthy"
    exit 0
else
    echo "❌ Health check FAILED - Expected HTTP 200, got HTTP $HTTP_STATUS" >&2
    exit 1
fi 