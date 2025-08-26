#!/usr/bin/env bash
# test-quota-402.sh - Test quota 402 path for Free plan users
set -euo pipefail

DOMAIN="${1:-https://www.adminer.online}"
CLERK_TOKEN="${CLERK_TOKEN:-}"

if [ -z "$CLERK_TOKEN" ]; then
  echo "❌ CLERK_TOKEN environment variable required"
  echo "Usage: CLERK_TOKEN=your_token ./scripts/test-quota-402.sh [domain]"
  exit 1
fi

echo "🧪 Testing quota 402 path for Free plan users"
echo "Domain: $DOMAIN"
echo ""

# Test 11 job creation calls (Free plan has 10 ads limit)
echo "Making 11 job creation calls to test quota limits..."
echo "Expected: Last call should return HTTP 402 with upgrade link"
echo ""

for i in {1..11}; do
  echo "Call $i/11: Creating job with keyword 'test-$i'..."
  
  response=$(curl -s -w "%{http_code}" \
    -H "Authorization: Bearer $CLERK_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"keyword\":\"test-$i\",\"limit\":1}" \
    "$DOMAIN/api/jobs/start" || echo "000")
  
  http_code="${response: -3}"
  body="${response%???}"
  
  echo "  Status: $http_code"
  
  if [ "$http_code" = "402" ]; then
    echo "  ✅ Got 402 as expected - quota exceeded"
    echo "  Response: $body"
    break
  elif [ "$http_code" = "202" ] || [ "$http_code" = "200" ]; then
    echo "  ✅ Job created successfully"
  else
    echo "  ❌ Unexpected status: $http_code"
    echo "  Response: $body"
  fi
  
  echo ""
  
  # Small delay between calls
  sleep 0.5
done

echo "🎯 Quota 402 test completed"
echo ""
echo "Expected behavior:"
echo "- Calls 1-10: Should succeed (202/200)"
echo "- Call 11: Should fail with 402 (quota exceeded)"
echo "- 402 response should include upgradeUrl" 