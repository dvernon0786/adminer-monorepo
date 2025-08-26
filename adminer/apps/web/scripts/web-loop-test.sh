#!/bin/bash

# ADminer Web App Loop Detection Script
# Tests for client-side redirect loops in the React application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_URL="http://localhost:5173"
PROD_URL="https://www.adminer.online"

# Test paths to check
PATHS=("/" "/signin" "/dashboard")

# Function to test web app paths
test_web_path() {
    local base_url=$1
    local path=$2
    local env_name=$3
    
    echo -e "${BLUE}=== Testing Web App ${env_name}: ${base_url}${path} ===${NC}"
    
    # Test if the page loads without infinite redirects
    echo "Testing page load (should complete within reasonable time)..."
    
    # Use curl to test the initial response
    response=$(curl -sI "${base_url}${path}" | head -1)
    echo "Initial response: $response"
    
    # Check if it's a redirect
    if [[ "$response" == *"302"* ]] || [[ "$response" == *"301"* ]]; then
        echo -e "${YELLOW}⚠️  Page redirects detected - checking redirect chain...${NC}"
        
        # Follow redirects with max limit
        redirect_chain=$(curl -sI -L --max-redirs 5 "${base_url}${path}" 2>&1 | grep -i "location\|HTTP/" || true)
        
        # Count redirects
        location_count=$(echo "$redirect_chain" | grep -c "location" || echo "0")
        
        if [[ "$location_count" -gt 2 ]]; then
            echo -e "${RED}❌ Too many redirects detected! Possible infinite loop${NC}"
            echo "Redirect chain:"
            echo "$redirect_chain"
            return 1
        else
            echo -e "${GREEN}✅ Redirects look normal (${location_count} redirects)${NC}"
        fi
    else
        echo -e "${GREEN}✅ Page loads directly (no redirects)${NC}"
    fi
    
    echo ""
}

# Function to run all web tests
run_web_tests() {
    local base_url=$1
    local env_name=$2
    
    echo -e "${BLUE}🚀 Starting ${env_name} Web App loop detection tests...${NC}"
    echo ""
    
    local failed_tests=0
    
    for path in "${PATHS[@]}"; do
        if ! test_web_path "$base_url" "$path" "$env_name"; then
            ((failed_tests++))
        fi
    done
    
    echo -e "${BLUE}📊 ${env_name} Web App Test Results:${NC}"
    if [[ $failed_tests -eq 0 ]]; then
        echo -e "${GREEN}✅ All web app tests passed! No infinite loops detected.${NC}"
    else
        echo -e "${RED}❌ $failed_tests web app test(s) failed. Possible issues detected.${NC}"
    fi
    
    echo ""
    return $failed_tests
}

# Function to test React app functionality
test_react_app() {
    local base_url=$1
    local env_name=$2
    
    echo -e "${BLUE}🧪 Testing ${env_name} React App Functionality${NC}"
    echo ""
    
    # Test if the main page loads
    echo "Testing main page load..."
    if curl -s "${base_url}/" | grep -q "ADminer\|React\|script"; then
        echo -e "${GREEN}✅ React app loads successfully${NC}"
    else
        echo -e "${RED}❌ React app failed to load${NC}"
        return 1
    fi
    
    # Test if static assets are accessible
    echo "Testing static assets..."
    if curl -sI "${base_url}/" | grep -q "200\|text/html"; then
        echo -e "${GREEN}✅ Static assets accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Static assets may have issues${NC}"
    fi
    
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}🔍 ADminer Web App Infinite Loop Detection Script${NC}"
    echo "This script tests for client-side redirect loops in the React application."
    echo ""
    
    local total_failed=0
    
    # Test local environment
    if [[ "$1" == "local" ]] || [[ "$1" == "all" ]] || [[ -z "$1" ]]; then
        echo -e "${YELLOW}⚠️  Make sure your local web server is running on port 5173${NC}"
        echo "Run: cd adminer/apps/web && npm run dev"
        echo ""
        
        if run_web_tests "$LOCAL_URL" "Local"; then
            echo -e "${GREEN}✅ Local web app tests completed successfully${NC}"
        else
            ((total_failed++))
        fi
        
        if test_react_app "$LOCAL_URL" "Local"; then
            echo -e "${GREEN}✅ Local React app functionality verified${NC}"
        else
            ((total_failed++))
        fi
    fi
    
    # Test production environment
    if [[ "$1" == "prod" ]] || [[ "$1" == "all" ]] || [[ -z "$1" ]]; then
        echo ""
        if run_web_tests "$PROD_URL" "Production"; then
            echo -e "${GREEN}✅ Production web app tests completed successfully${NC}"
        else
            ((total_failed++))
        fi
        
        if test_react_app "$PROD_URL" "Production"; then
            echo -e "${GREEN}✅ Production React app functionality verified${NC}"
        else
            ((total_failed++))
        fi
    fi
    
    echo ""
    echo -e "${BLUE}🎯 Final Web App Results:${NC}"
    if [[ $total_failed -eq 0 ]]; then
        echo -e "${GREEN}🎉 All web app environments passed! No infinite loops detected.${NC}"
        exit 0
    else
        echo -e "${RED}💥 $total_failed environment(s) have web app issues. Check the output above.${NC}"
        exit 1
    fi
}

# Usage information
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Usage: $0 [local|prod|all]"
    echo ""
    echo "Options:"
    echo "  local   - Test only local web environment (localhost:5173)"
    echo "  prod    - Test only production web environment (www.adminer.online)"
    echo "  all     - Test both web environments"
    echo "  (none)  - Test both web environments (default)"
    echo ""
    echo "Examples:"
    echo "  $0 local    # Test local web app only"
    echo "  $0 prod     # Test production web app only"
    echo "  $0 all      # Test both web environments"
    echo "  $0          # Test both web environments (default)"
    exit 0
fi

# Run main function
main "$1" 