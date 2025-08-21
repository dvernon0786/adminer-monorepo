#!/bin/bash

# ADminer Loop Detection Script
# Tests for infinite redirect loops in both local and production environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_URL="http://localhost:3000"
PROD_URL="https://www.adminer.online"

# Test paths to check
PATHS=("/" "/signin" "/dashboard" "/api/consolidated?action=health")

# Function to test a single path
test_path() {
    local base_url=$1
    local path=$2
    local env_name=$3
    
    echo -e "${BLUE}=== Testing ${env_name}: ${base_url}${path} ===${NC}"
    
    # Test health endpoint (should never redirect)
    if [[ "$path" == *"health"* ]]; then
        echo "Testing health endpoint (should return 200, no redirects)..."
        response=$(curl -sI "${base_url}${path}" | head -1)
        if [[ "$response" == *"200"* ]]; then
            echo -e "${GREEN}✅ Health endpoint: 200 OK${NC}"
        else
            echo -e "${RED}❌ Health endpoint failed: $response${NC}"
            return 1
        fi
        return 0
    fi
    
    # Test page redirects (should have max 1-2 redirects)
    echo "Testing page redirects (max 5 allowed)..."
    
    # Follow redirects with max limit
    redirect_chain=$(curl -sI -L --max-redirs 5 "${base_url}${path}" 2>&1 | grep -i "location\|HTTP/" || true)
    
    # Count HTTP responses
    http_count=$(echo "$redirect_chain" | grep -c "HTTP/" || echo "0")
    location_count=$(echo "$redirect_chain" | grep -c "location" || echo "0")
    
    echo "HTTP responses: $http_count"
    echo "Location headers: $location_count"
    
    # Check for redirect loops
    if [[ "$http_count" -gt 5 ]]; then
        echo -e "${RED}❌ Too many redirects detected! Possible infinite loop${NC}"
        echo "Redirect chain:"
        echo "$redirect_chain"
        return 1
    elif [[ "$location_count" -gt 2 ]]; then
        echo -e "${YELLOW}⚠️  Multiple redirects detected (${location_count}) - investigate${NC}"
        echo "Redirect chain:"
        echo "$redirect_chain"
    else
        echo -e "${GREEN}✅ Redirects look normal (${location_count} redirects)${NC}"
    fi
    
    echo ""
}

# Function to run all tests
run_tests() {
    local base_url=$1
    local env_name=$2
    
    echo -e "${BLUE}🚀 Starting ${env_name} loop detection tests...${NC}"
    echo ""
    
    local failed_tests=0
    
    for path in "${PATHS[@]}"; do
        if ! test_path "$base_url" "$path" "$env_name"; then
            ((failed_tests++))
        fi
    done
    
    echo -e "${BLUE}📊 ${env_name} Test Results:${NC}"
    if [[ $failed_tests -eq 0 ]]; then
        echo -e "${GREEN}✅ All tests passed! No infinite loops detected.${NC}"
    else
        echo -e "${RED}❌ $failed_tests test(s) failed. Possible issues detected.${NC}"
    fi
    
    echo ""
    return $failed_tests
}

# Main execution
main() {
    echo -e "${BLUE}🔍 ADminer Infinite Loop Detection Script${NC}"
    echo "This script tests for redirect loops that could cause infinite redirects."
    echo ""
    
    local total_failed=0
    
    # Test local environment
    if [[ "$1" == "local" ]] || [[ "$1" == "all" ]] || [[ -z "$1" ]]; then
        echo -e "${YELLOW}⚠️  Make sure your local API server is running on port 3000${NC}"
        echo "Run: cd adminer/apps/api && npm run dev"
        echo ""
        
        if run_tests "$LOCAL_URL" "Local"; then
            echo -e "${GREEN}✅ Local tests completed successfully${NC}"
        else
            ((total_failed++))
        fi
    fi
    
    # Test production environment
    if [[ "$1" == "prod" ]] || [[ "$1" == "all" ]] || [[ -z "$1" ]]; then
        echo ""
        if run_tests "$PROD_URL" "Production"; then
            echo -e "${GREEN}✅ Production tests completed successfully${NC}"
        else
            ((total_failed++))
        fi
    fi
    
    echo ""
    echo -e "${BLUE}🎯 Final Results:${NC}"
    if [[ $total_failed -eq 0 ]]; then
        echo -e "${GREEN}🎉 All environments passed! No infinite loops detected.${NC}"
        exit 0
    else
        echo -e "${RED}💥 $total_failed environment(s) have issues. Check the output above.${NC}"
        exit 1
    fi
}

# Usage information
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Usage: $0 [local|prod|all]"
    echo ""
    echo "Options:"
    echo "  local   - Test only local environment (localhost:3000)"
    echo "  prod    - Test only production environment (www.adminer.online)"
    echo "  all     - Test both environments"
    echo "  (none)  - Test both environments (default)"
    echo ""
    echo "Examples:"
    echo "  $0 local    # Test local only"
    echo "  $0 prod     # Test production only"
    echo "  $0 all      # Test both"
    echo "  $0          # Test both (default)"
    exit 0
fi

# Run main function
main "$1" 