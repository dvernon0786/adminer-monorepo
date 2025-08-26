#!/bin/bash

# Production Deployment Verification Script
# Run this after deploying to verify CSP and integrations work correctly

echo "🔍 Production Deployment Verification"
echo "====================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="https://www.adminer.online"
CLERK_URL="https://clerk.adminer.online"

echo "🌐 Testing: $BASE_URL"
echo "🔐 Clerk Domain: $CLERK_URL"
echo ""

# Test 1: CSP Headers
echo "1️⃣ Testing CSP Headers..."
if curl -sI "$BASE_URL" | grep -i '^content-security-policy:' > /dev/null; then
    echo -e "   ${GREEN}✅ CSP Header Found${NC}"
    
    # Extract and display CSP header
    csp_header=$(curl -sI "$BASE_URL" | grep -i '^content-security-policy:' | cut -d' ' -f2-)
    echo "   📋 CSP: ${csp_header:0:60}..."
else
    echo -e "   ${RED}❌ CSP Header Missing${NC}"
fi
echo ""

# Test 2: Clerk Script Loading
echo "2️⃣ Testing Clerk Script..."
clerk_status=$(curl -sI "$CLERK_URL/npm/@clerk/clerk-js@5/dist/clerk.browser.js" | head -n 1)
if echo "$clerk_status" | grep "200" > /dev/null; then
    echo -e "   ${GREEN}✅ Clerk Script Loads${NC}"
    echo "   📡 Status: $clerk_status"
else
    echo -e "   ${RED}❌ Clerk Script Failed${NC}"
    echo "   📡 Status: $clerk_status"
fi
echo ""

# Test 3: Google Fonts
echo "3️⃣ Testing Google Fonts..."
fonts_status=$(curl -sI "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" | head -n 1)
if echo "$fonts_status" | grep "200" > /dev/null; then
    echo -e "   ${GREEN}✅ Google Fonts Load${NC}"
    echo "   📡 Status: $fonts_status"
else
    echo -e "   ${RED}❌ Google Fonts Failed${NC}"
    echo "   📡 Status: $fonts_status"
fi
echo ""

# Test 4: SPA Assets
echo "4️⃣ Testing SPA Assets..."
spa_status=$(curl -sI "$BASE_URL/" | head -n 1)
if echo "$spa_status" | grep "200" > /dev/null; then
    echo -e "   ${GREEN}✅ SPA Loads${NC}"
    echo "   📡 Status: $spa_status"
else
    echo -e "   ${RED}❌ SPA Failed${NC}"
    echo "   📡 Status: $spa_status"
fi
echo ""

# Test 5: Security Headers
echo "5️⃣ Testing Security Headers..."
security_headers=(
    "x-frame-options"
    "x-content-type-options"
    "referrer-policy"
    "permissions-policy"
)

for header in "${security_headers[@]}"; do
    if curl -sI "$BASE_URL" | grep -i "^$header:" > /dev/null; then
        header_value=$(curl -sI "$BASE_URL" | grep -i "^$header:" | cut -d' ' -f2-)
        echo -e "   ${GREEN}✅${NC} $header: $header_value"
    else
        echo -e "   ${YELLOW}⚠️${NC} $header: Not found"
    fi
done
echo ""

# Test 6: API Endpoints
echo "6️⃣ Testing API Endpoints..."
api_endpoints=(
    "/api/consolidated"
)

for endpoint in "${api_endpoints[@]}"; do
    api_status=$(curl -sI "$BASE_URL$endpoint" | head -n 1)
    if echo "$api_status" | grep -E "(200|401|403)" > /dev/null; then
        echo -e "   ${GREEN}✅${NC} $endpoint: Available"
    else
        echo -e "   ${RED}❌${NC} $endpoint: $api_status"
    fi
done
echo ""

echo "🎉 Verification Complete!"
echo ""
echo -e "${YELLOW}📝 Manual Testing Required:${NC}"
echo "   1. Open browser and navigate to $BASE_URL"
echo "   2. Check browser console for CSP violations"
echo "   3. Test Clerk authentication flow"
echo "   4. Verify fonts render correctly (Inter, Plus Jakarta Sans)"
echo "   5. Test all interactive features"
echo ""
echo -e "${GREEN}✅ If all tests pass and manual testing succeeds, your deployment is ready!${NC}"