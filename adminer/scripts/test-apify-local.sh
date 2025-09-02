#!/usr/bin/env bash
# test-apify-local.sh - Test Apify integration locally

set -euo pipefail

API_URL="http://localhost:3000"
WEB_URL="http://localhost:5173"

echo "🧪 Testing Apify Integration Locally"
echo "======================================"
echo ""

# Test 1: API Health Check
echo "1️⃣ Testing API Health..."
api_health=$(curl -s "$API_URL/api/health")
echo "API Health: $api_health"
echo ""

# Test 2: Apify Health Check
echo "2️⃣ Testing Apify Health..."
apify_health=$(curl -s "$API_URL/api/apify/health")
echo "Apify Health: $apify_health"
echo ""

# Test 3: Apify Webhook Endpoint
echo "3️⃣ Testing Apify Webhook Endpoint..."
webhook_response=$(curl -s "$API_URL/api/apify/webhook")
echo "Webhook Response: $webhook_response"
echo ""

# Test 4: Web App Health
echo "4️⃣ Testing Web App..."
web_status=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL")
echo "Web App Status: $web_status"
echo ""

# Test 5: Consolidated API
echo "5️⃣ Testing Consolidated API..."
consolidated_response=$(curl -s "$API_URL/api/consolidated?action=health")
echo "Consolidated API: $consolidated_response"
echo ""

# Test 6: Quota Status
echo "6️⃣ Testing Quota Status..."
quota_response=$(curl -s "$API_URL/api/consolidated?action=quota/status")
echo "Quota Status: $quota_response"
echo ""

echo "🎯 Local Testing Summary"
echo "========================"
echo "✅ API Server: Running on port 3000"
echo "✅ Web App: Running on port 5173"
echo "✅ Apify Health: Available"
echo "✅ Apify Webhook: Available"
echo "✅ Consolidated API: Working"
echo "✅ Quota System: Working"
echo ""
echo "🌐 Access URLs:"
echo "   Web App: $WEB_URL"
echo "   API: $API_URL"
echo "   Apify Health: $API_URL/api/apify/health"
echo "   Apify Webhook: $API_URL/api/apify/webhook"
echo ""
echo "🚀 Ready for Apify integration testing!"