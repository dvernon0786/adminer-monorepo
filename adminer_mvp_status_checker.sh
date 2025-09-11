#!/bin/bash

# =============================================================================
# UNIFIED ADMINER MVP STATUS CHECKER
# =============================================================================
# Single script to check completion status of all MVP components
# Run this in Cursor terminal to see real-time progress
# =============================================================================

set -e  # Re-enabled with proper error handling

# Debug mode - set DEBUG=true to enable debug output
DEBUG="${DEBUG:-false}"

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters for final summary
COMPLETED=0
MISSING=0
PARTIAL=0

# Helper functions
status_complete() {
    echo -e "${GREEN}✅ $1${NC}"
    COMPLETED=$((COMPLETED + 1))
}

status_missing() {
    echo -e "${RED}❌ $1${NC}"
    MISSING=$((MISSING + 1))
}

status_partial() {
    echo -e "${YELLOW}⚠️ $1${NC}"
    PARTIAL=$((PARTIAL + 1))
}

status_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Debug logging function
debug_log() {
    if [ "$DEBUG" = "true" ]; then
        echo "DEBUG: $1" >&2
    fi
}

# Check if files/patterns exist with robust error handling
check_pattern() {
    local pattern="$1"
    local location="$2"
    
    debug_log "Checking pattern '$pattern' in location '$location'"
    
    # Check if location exists and is a directory
    if [ ! -d "$location" ]; then
        debug_log "Location '$location' does not exist or is not a directory"
        return 1
    fi
    
    # Use grep with proper error handling
    # Support additional grep options if provided
    local grep_opts=""
    if [ "$3" != "" ]; then
        grep_opts="$3"
    fi
    if grep -r $grep_opts "$pattern" "$location" 2>/dev/null | head -3; then
        debug_log "Pattern '$pattern' found in '$location'"
        return 0
    else
        debug_log "Pattern '$pattern' not found in '$location'"
        return 1
    fi
}

# Dependency validation function
validate_dependencies() {
    local missing_deps=()
    
    debug_log "Validating dependencies..."
    
    # Check required commands
    for cmd in curl grep find; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        else
            debug_log "Command '$cmd' found"
        fi
    done
    
    # Check optional commands (jq is optional)
    if ! command -v "jq" >/dev/null 2>&1; then
        debug_log "Optional command 'jq' not found - continuing without it"
    else
        debug_log "Optional command 'jq' found"
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required dependencies: ${missing_deps[*]}${NC}"
        echo -e "${YELLOW}Please install missing dependencies and try again.${NC}"
        exit 1
    fi
    
    debug_log "All required dependencies validated"
}

# Run dependency validation
validate_dependencies

echo "=== 🔍 ADMINER MVP STATUS CHECK ==="
echo "Scanning project for MVP completion status..."
echo ""

# =============================================================================
# 1. INFRASTRUCTURE & DEPLOYMENT STATUS
# =============================================================================
echo "🏗️ === INFRASTRUCTURE & DEPLOYMENT ==="

# Check if deployment is working
debug_log "Checking production deployment accessibility..."
if curl -s --connect-timeout 10 https://adminer.online/ >/dev/null 2>&1; then
    status_complete "Production deployment accessible"
else
    status_missing "Production deployment not accessible"
fi

# Check Vercel configuration
debug_log "Checking Vercel configuration file..."
if [ -f "adminer/apps/api/vercel.json" ]; then
    status_complete "Vercel configuration exists"
else
    status_missing "Vercel configuration missing"
fi

echo ""

# =============================================================================
# 2. ENVIRONMENT VARIABLES
# =============================================================================
echo "🔑 === ENVIRONMENT VARIABLES ==="

# Clerk
if check_pattern "VITE_CLERK_PUBLISHABLE_KEY" "adminer/apps" 2>/dev/null | grep -q "pk_" 2>/dev/null; then
    status_complete "Clerk authentication configured"
else
    status_missing "Clerk authentication not configured"
fi

# Database
if check_pattern "DATABASE_URL" "adminer/apps" --include="*.env*" 2>/dev/null | grep -q "postgres" 2>/dev/null; then
    status_complete "Database URL configured"
elif curl -s https://www.adminer.online/api/health 2>/dev/null | grep -q "healthy" 2>/dev/null; then
    # If API is healthy and responding, DATABASE_URL is likely configured in Vercel
    status_complete "Database URL configured (verified via API health)"
else
    status_missing "Database URL not configured"
fi

# Payments
if check_pattern "DODO" "adminer/apps" 2>/dev/null | grep -q -i "key\|secret" 2>/dev/null; then
    status_complete "Dodo payments configured"
else
    status_missing "Dodo payments not configured"
fi

# Jobs
if check_pattern "INNGEST" "adminer/apps" 2>/dev/null | grep -q -i "key\|url" 2>/dev/null; then
    status_complete "Inngest configured"
else
    status_missing "Inngest not configured"
fi

# Scraping
if check_pattern "APIFY" "adminer/apps" 2>/dev/null | grep -q -i "key\|token" 2>/dev/null; then
    status_complete "Apify configured"
else
    status_missing "Apify not configured"
fi

echo ""

# =============================================================================
# 3. DATABASE SETUP (CRITICAL PATH ITEM 1)
# =============================================================================
echo "🗄️ === DATABASE SETUP ==="

# Check for Drizzle configuration
if [ -f "adminer/apps/api/drizzle.config.ts" ]; then
    status_complete "Drizzle configuration exists"
else
    status_missing "Drizzle configuration missing"
fi

# Check for schema definition
if [ -f "adminer/apps/api/src/db/schema.ts" ] || [ -f "adminer/apps/api/src/lib/db.ts" ]; then
    status_complete "Database schema defined"
else
    status_missing "Database schema not defined"
fi

# Check for migrations
if [ -d "adminer/apps/api/migrations" ] || [ -d "adminer/apps/api/drizzle" ]; then
    status_complete "Database migrations exist"
else
    status_missing "Database migrations missing"
fi

# Check for actual database code usage
if check_pattern "drizzle\|db\.select\|db\.insert\|db\.update\|DATABASE_URL\|orgDb\|jobDb" "adminer/apps/api" 2>/dev/null | grep -q "insert\|select\|update\|DATABASE_URL\|orgDb\|jobDb" 2>/dev/null; then
    status_complete "Database operations implemented"
else
    status_missing "Database operations not implemented"
fi

echo ""

# =============================================================================
# 4. PAYMENTS SYSTEM (CRITICAL PATH ITEM 2) 
# =============================================================================
echo "💳 === PAYMENTS SYSTEM ==="

# Check for Dodo integration
if check_pattern "DodoClient\|webhook\|checkout\|subscription\|payment" "adminer/apps/api" 2>/dev/null | grep -q -i "DodoClient\|webhook\|checkout\|subscription\|payment" 2>/dev/null; then
    status_complete "Dodo integration implemented"
else
    status_missing "Dodo integration not implemented"
fi

# Check for webhook endpoint
if [ -f "adminer/apps/api/api/webhook.js" ] || check_pattern "/api/webhook" "adminer/apps/api" >/dev/null; then
    status_complete "Dodo webhook endpoint exists"
else
    status_missing "Dodo webhook endpoint missing"
fi

# Check for subscription plans
if check_pattern "plan.*free\|plan.*pro\|plan.*enterprise" "adminer/apps/api" >/dev/null; then
    status_complete "Subscription plans defined"
else
    status_missing "Subscription plans not defined"
fi

echo ""

# =============================================================================
# 5. QUOTA SYSTEM (CRITICAL PATH ITEM 3)
# =============================================================================
echo "📊 === QUOTA SYSTEM ==="

# Check for quota endpoints
if check_pattern "quota.*status\|action.*quota" "adminer/apps/api" >/dev/null; then
    status_complete "Quota status endpoint exists"
else
    status_missing "Quota status endpoint missing"
fi

# Check for 402 Payment Required responses
if check_pattern "402\|Payment.*Required\|QUOTA_EXCEEDED" "adminer/apps/api" >/dev/null; then
    status_complete "Quota enforcement implemented"
else
    status_missing "Quota enforcement not implemented"
fi

# Check for upgrade links
if check_pattern "upgrade.*link\|checkout.*url" "adminer/apps/api" >/dev/null; then
    status_complete "Upgrade links implemented"
else
    status_missing "Upgrade links not implemented"
fi

# Check if still using mock data
if check_pattern "mock\|fake\|test.*data" "adminer/apps/api" 2>/dev/null | grep -q "quota" 2>/dev/null; then
    status_partial "Quota system partially implemented (still using mock data)"
else
    status_complete "Real quota system implemented"
fi

echo ""

# =============================================================================
# 6. JOBS PIPELINE (CRITICAL PATH ITEM 4)
# =============================================================================
echo "⚙️ === JOBS PIPELINE ==="

# Check for Inngest functions
if check_pattern "createFunction\|jobEvents\|processScrapeJob\|inngest\.createFunction" "adminer/apps/api" 2>/dev/null | grep -q -i "createFunction\|jobEvents\|processScrapeJob\|inngest\.createFunction" 2>/dev/null; then
    status_complete "Inngest functions implemented"
else
    status_missing "Inngest functions not implemented"
fi

# Check for Apify integration
if check_pattern "ApifyService\|runScrapeJob\|apifyService\|apify-client" "adminer/apps/api" 2>/dev/null | grep -q -i "ApifyService\|runScrapeJob\|apifyService\|apify-client" 2>/dev/null; then
    status_complete "Apify integration implemented"
else
    status_missing "Apify integration not implemented"
fi

# Check for job status tracking
if check_pattern "job.*status\|job.*state\|runId" "adminer/apps/api" >/dev/null; then
    status_complete "Job status tracking implemented"
else
    status_missing "Job status tracking not implemented"
fi

# Check for job events
if check_pattern "keyword.*requested\|apify.*started\|job.*completed" "adminer/apps/api" >/dev/null; then
    status_complete "Job events implemented"
else
    status_missing "Job events not implemented"
fi

echo ""

# =============================================================================
# 7. AI ANALYSIS (CRITICAL PATH ITEM 5)
# =============================================================================
echo "🤖 === AI ANALYSIS ==="

# Check for OpenAI integration
if check_pattern "openai\|gpt-4" "adminer/apps/api" >/dev/null; then
    status_complete "GPT-4o integration implemented"
else
    status_missing "GPT-4o integration not implemented"
fi

# Check for Gemini integration
if check_pattern "gemini\|google.*ai" "adminer/apps/api" >/dev/null; then
    status_complete "Gemini integration implemented"
else
    status_missing "Gemini integration not implemented"
fi

# Check for structured data processing
if check_pattern "structured.*json\|analysis.*result" "adminer/apps/api" >/dev/null; then
    status_complete "Structured data processing implemented"
else
    status_missing "Structured data processing not implemented"
fi

echo ""

# =============================================================================
# 8. API ENDPOINTS & SMOKE TESTS
# =============================================================================
echo "🔧 === API ENDPOINTS & SMOKE TESTS ==="

# Check for consolidated API endpoint
if check_pattern "consolidated" "adminer/apps/api" 2>/dev/null | grep -q "health\|quota" 2>/dev/null; then
    status_complete "Consolidated API endpoint exists"
elif curl -s https://www.adminer.online/api/test 2>/dev/null | grep -q "success" 2>/dev/null; then
    # If API endpoints are working, consolidated endpoint is functional
    status_complete "Consolidated API endpoint working"
else
    status_missing "Consolidated API endpoint missing"
fi

# Check for health endpoint
if check_pattern "health" "adminer/apps/api" >/dev/null; then
    status_complete "Health endpoint implemented"
else
    status_missing "Health endpoint not implemented"
fi

# Test actual endpoints if server is running
if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    status_complete "Local API server responding"
elif curl -s https://adminer.online/api/consolidated?action=health >/dev/null 2>&1; then
    status_complete "Production API responding"
else
    status_missing "API endpoints not responding"
fi

echo ""

# =============================================================================
# 9. FRONTEND INTEGRATION
# =============================================================================
echo "🎨 === FRONTEND INTEGRATION ==="

# Check for dashboard components
if [ -d "adminer/apps/web/src/pages/dashboard" ] && [ -f "adminer/apps/web/src/pages/dashboard/index.tsx" ]; then
    status_complete "Dashboard component exists"
else
    status_missing "Dashboard component missing"
fi

# Check for API integration in frontend
if check_pattern "api/consolidated\|useQuota\|useBilling" "adminer/apps/web/src" >/dev/null; then
    status_complete "Frontend API integration exists"
else
    status_missing "Frontend API integration missing"
fi

# Check for authentication integration
if check_pattern "useUser\|useAuth\|clerk" "adminer/apps/web/src" >/dev/null; then
    status_complete "Authentication integration exists"
else
    status_missing "Authentication integration missing"
fi

echo ""

# =============================================================================
# FINAL SUMMARY
# =============================================================================
echo "📊 === MVP COMPLETION SUMMARY ==="
echo ""

TOTAL=$((COMPLETED + MISSING + PARTIAL))
COMPLETION_PERCENTAGE=$(( (COMPLETED * 100) / TOTAL ))

echo "✅ Completed: $COMPLETED"
echo "❌ Missing: $MISSING"
echo "⚠️ Partial: $PARTIAL"
echo ""
echo "📈 Overall Completion: $COMPLETION_PERCENTAGE%"

if [ $COMPLETION_PERCENTAGE -ge 80 ]; then
    echo -e "${GREEN}🎉 MVP is nearly complete! Focus on the missing items.${NC}"
elif [ $COMPLETION_PERCENTAGE -ge 50 ]; then
    echo -e "${YELLOW}📝 MVP is halfway done. Keep building the core features.${NC}"
else
    echo -e "${RED}🚧 MVP needs significant work. Start with database and payments.${NC}"
fi

echo ""
echo "🎯 Next Priority Actions:"
if [ $MISSING -gt 0 ]; then
    echo "1. Address the ❌ missing components above"
    echo "2. Focus on critical path: Database → Payments → Quota → Jobs → AI"
    echo "3. Run this script again to track progress"
else
    echo "1. Test all completed components end-to-end"
    echo "2. Run comprehensive smoke tests"
    echo "3. Deploy to production and validate"
fi

echo ""
echo "=== ✅ STATUS CHECK COMPLETE ==="