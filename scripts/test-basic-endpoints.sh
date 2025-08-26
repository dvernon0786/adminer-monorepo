#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Testing Basic Endpoints (No Auth Required)"

# Test 1: Health endpoint
echo -e "\n📋 Test 1: Health endpoint"
curl -s "https://www.adminer.online/api/consolidated?action=health" | jq . || echo "❌ Health endpoint failed"

# Test 2: Root page
echo -e "\n📋 Test 2: Root page"
curl -s -I "https://www.adminer.online/" | head -3 || echo "❌ Root page failed"

# Test 3: Webhook endpoint (should reject without signature)
echo -e "\n📋 Test 3: Webhook endpoint"
curl -s -X POST -H "Content-Type: application/json" -d '{}' "https://www.adminer.online/api/dodo/webhook" | jq . || echo "❌ Webhook endpoint failed"

echo -e "\n✅ Basic endpoint tests completed" 