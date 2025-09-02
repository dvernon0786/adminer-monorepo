#!/bin/bash

# Inngest Testing Script
# Tests both local and production Inngest functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_API_URL="http://localhost:3000"
PROD_API_URL="https://adminer.online"
LOCAL_INNGEST_URL="http://localhost:8288"

# Helper functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test function
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    log "Testing: $description"
    log "URL: $url"
    
    if response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" -eq "$expected_status" ]; then
            success "$description - HTTP $http_code"
            if [ -n "$body" ] && [ "$body" != "null" ]; then
                echo "Response: $(echo "$body" | head -c 100)..."
            fi
            return 0
        else
            error "$description - Expected HTTP $expected_status, got $http_code"
            echo "Response: $body"
            return 1
        fi
    else
        error "$description - Connection failed"
        return 1
    fi
}

# Test job creation
test_job_creation() {
    local base_url=$1
    local env_name=$2
    
    log "Testing job creation in $env_name"
    
    local job_data='{
        "type": "scrape",
        "input": {
            "url": "https://example.com",
            "pages": 5
        }
    }'
    
    if response=$(curl -s -w "\n%{http_code}" -X POST "$base_url/api/jobs" \
        -H "Content-Type: application/json" \
        -H "x-org-id: test-org" \
        -d "$job_data" 2>/dev/null); then
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" -eq "201" ]; then
            success "Job creation in $env_name - HTTP $http_code"
            echo "Job ID: $(echo "$body" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)"
            return 0
        else
            error "Job creation in $env_name - Expected HTTP 201, got $http_code"
            echo "Response: $body"
            return 1
        fi
    else
        error "Job creation in $env_name - Connection failed"
        return 1
    fi
}

# Test quota enforcement
test_quota_enforcement() {
    local base_url=$1
    local env_name=$2
    
    log "Testing quota enforcement in $env_name"
    
    # Try to create a job that should exceed quota
    local job_data='{
        "type": "scrape",
        "input": {
            "url": "https://example.com",
            "pages": 1000
        }
    }'
    
    if response=$(curl -s -w "\n%{http_code}" -X POST "$base_url/api/jobs" \
        -H "Content-Type: application/json" \
        -H "x-org-id: test-org" \
        -d "$job_data" 2>/dev/null); then
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" -eq "402" ]; then
            success "Quota enforcement in $env_name - HTTP $http_code (Payment Required)"
            return 0
        else
            warning "Quota enforcement in $env_name - Expected HTTP 402, got $http_code"
            echo "Response: $body"
            return 1
        fi
    else
        error "Quota enforcement in $env_name - Connection failed"
        return 1
    fi
}

# Main test function
run_tests() {
    local environment=$1
    
    echo "🧪 Inngest Testing Script"
    echo "========================="
    echo
    
    if [ "$environment" = "local" ] || [ "$environment" = "all" ]; then
        echo "🏠 Testing Local Environment"
        echo "---------------------------"
        
        # Check if local server is running
        if ! curl -s "$LOCAL_API_URL/api/consolidated?action=health" > /dev/null 2>&1; then
            error "Local API server not running. Start with: cd adminer/apps/api && npm run dev"
            return 1
        fi
        
        # Test local endpoints
        test_endpoint "$LOCAL_API_URL/api/consolidated?action=health" "Local Health Check"
        test_endpoint "$LOCAL_API_URL/api/inngest" "Local Inngest Functions Discovery"
        test_job_creation "$LOCAL_API_URL" "Local"
        test_quota_enforcement "$LOCAL_API_URL" "Local"
        
        echo
    fi
    
    if [ "$environment" = "prod" ] || [ "$environment" = "all" ]; then
        echo "🌐 Testing Production Environment"
        echo "--------------------------------"
        
        # Test production endpoints
        test_endpoint "$PROD_API_URL/api/consolidated?action=health" "Production Health Check"
        test_endpoint "$PROD_API_URL/api/inngest" "Production Inngest Functions Discovery"
        test_job_creation "$PROD_API_URL" "Production"
        test_quota_enforcement "$PROD_API_URL" "Production"
        
        echo
    fi
    
    echo "🎉 Testing Complete!"
}

# Check if Inngest dev server is running (local only)
check_inngest_dev_server() {
    if curl -s "$LOCAL_INNGEST_URL" > /dev/null 2>&1; then
        success "Inngest dev server is running at $LOCAL_INNGEST_URL"
        return 0
    else
        warning "Inngest dev server not running. Start with: npx inngest-cli@latest dev"
        return 1
    fi
}

# Help function
show_help() {
    echo "Inngest Testing Script"
    echo
    echo "Usage: $0 [local|prod|all]"
    echo
    echo "Options:"
    echo "  local    Test local development environment"
    echo "  prod     Test production environment"
    echo "  all      Test both environments"
    echo "  help     Show this help message"
    echo
    echo "Examples:"
    echo "  $0 local     # Test local environment only"
    echo "  $0 prod      # Test production environment only"
    echo "  $0 all       # Test both environments"
    echo
    echo "Prerequisites:"
    echo "  Local: API server running (npm run dev)"
    echo "  Local: Inngest dev server running (npx inngest-cli@latest dev)"
    echo "  Prod:  Application deployed to Vercel"
}

# Main script logic
case "${1:-all}" in
    "local")
        check_inngest_dev_server
        run_tests "local"
        ;;
    "prod")
        run_tests "prod"
        ;;
    "all")
        check_inngest_dev_server
        run_tests "all"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac