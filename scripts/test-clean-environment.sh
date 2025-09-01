#!/bin/bash

# =============================================================================
# CLEAN ENVIRONMENT TESTING SCRIPT
# =============================================================================
# Tests the orchestrator and MVP status checker in a completely clean environment
# Creates isolated test directory and validates portability
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Debug mode
DEBUG="${DEBUG:-false}"

debug_log() {
    if [ "$DEBUG" = "true" ]; then
        echo "DEBUG: $1" >&2
    fi
}

# Create clean test environment
create_test_environment() {
    local test_dir="/tmp/adminer-test-$(date +%s)"
    
    debug_log "Creating test environment in: $test_dir"
    
    # Create test directory
    mkdir -p "$test_dir"
    
    # Copy minimal required files
    cp adminer.sh "$test_dir/"
    cp adminer_mvp_status_checker.sh "$test_dir/"
    cp scripts/validate-dependencies.sh "$test_dir/" 2>/dev/null || true
    
    # Create minimal directory structure
    mkdir -p "$test_dir/adminer/apps/api"
    mkdir -p "$test_dir/adminer/apps/web/src"
    mkdir -p "$test_dir/scripts"
    
    # Create minimal vercel.json
    cat > "$test_dir/adminer/apps/api/vercel.json" << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": "public",
  "framework": null
}
EOF
    
    # Create minimal package.json
    cat > "$test_dir/adminer/apps/api/package.json" << 'EOF'
{
  "name": "adminer-api",
  "version": "1.0.0",
  "scripts": {
    "build": "echo 'Build complete'"
  }
}
EOF
    
    echo "$test_dir"
}

# Test MVP status checker in clean environment
test_mvp_status_checker() {
    local test_dir="$1"
    
    debug_log "Testing MVP status checker in clean environment"
    
    cd "$test_dir"
    
    # Make script executable
    chmod +x adminer_mvp_status_checker.sh
    
    # Test with debug mode
    if DEBUG=true ./adminer_mvp_status_checker.sh > mvp_test.log 2>&1; then
        echo -e "${GREEN}✅ MVP status checker works in clean environment${NC}"
        return 0
    else
        echo -e "${RED}❌ MVP status checker failed in clean environment${NC}"
        echo "Error log:"
        cat mvp_test.log
        return 1
    fi
}

# Test orchestrator in clean environment
test_orchestrator() {
    local test_dir="$1"
    
    debug_log "Testing orchestrator in clean environment"
    
    cd "$test_dir"
    
    # Make script executable
    chmod +x adminer.sh
    
    # Test help command
    if ./adminer.sh help > orchestrator_test.log 2>&1; then
        echo -e "${GREEN}✅ Orchestrator help command works in clean environment${NC}"
    else
        echo -e "${RED}❌ Orchestrator help command failed in clean environment${NC}"
        echo "Error log:"
        cat orchestrator_test.log
        return 1
    fi
    
    # Test status command
    if ./adminer.sh status > status_test.log 2>&1; then
        echo -e "${GREEN}✅ Orchestrator status command works in clean environment${NC}"
    else
        echo -e "${RED}❌ Orchestrator status command failed in clean environment${NC}"
        echo "Error log:"
        cat status_test.log
        return 1
    fi
    
    return 0
}

# Test dependency validation in clean environment
test_dependency_validation() {
    local test_dir="$1"
    
    debug_log "Testing dependency validation in clean environment"
    
    cd "$test_dir"
    
    # Make script executable
    chmod +x validate-dependencies.sh
    
    # Test dependency validation
    if ./validate-dependencies.sh mvp-status > deps_test.log 2>&1; then
        echo -e "${GREEN}✅ Dependency validation works in clean environment${NC}"
        return 0
    else
        echo -e "${RED}❌ Dependency validation failed in clean environment${NC}"
        echo "Error log:"
        cat deps_test.log
        return 1
    fi
}

# Cleanup test environment
cleanup_test_environment() {
    local test_dir="$1"
    
    debug_log "Cleaning up test environment: $test_dir"
    
    if [ -d "$test_dir" ]; then
        rm -rf "$test_dir"
        echo -e "${BLUE}🧹 Test environment cleaned up${NC}"
    fi
}

# Main test function
main() {
    echo -e "${BLUE}🧪 Clean Environment Testing${NC}"
    echo "=============================="
    echo ""
    
    local test_dir=""
    local exit_code=0
    
    # Create test environment
    echo -e "${BLUE}Creating clean test environment...${NC}"
    test_dir=$(create_test_environment)
    echo -e "${GREEN}✅ Test environment created: $test_dir${NC}"
    echo ""
    
    # Test MVP status checker
    echo -e "${BLUE}Testing MVP status checker...${NC}"
    if ! test_mvp_status_checker "$test_dir"; then
        exit_code=1
    fi
    echo ""
    
    # Test orchestrator
    echo -e "${BLUE}Testing orchestrator...${NC}"
    if ! test_orchestrator "$test_dir"; then
        exit_code=1
    fi
    echo ""
    
    # Test dependency validation
    echo -e "${BLUE}Testing dependency validation...${NC}"
    if ! test_dependency_validation "$test_dir"; then
        exit_code=1
    fi
    echo ""
    
    # Cleanup
    cleanup_test_environment "$test_dir"
    
    # Final result
    echo ""
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ All clean environment tests passed${NC}"
        echo -e "${GREEN}🎉 Scripts are portable and robust${NC}"
    else
        echo -e "${RED}❌ Some clean environment tests failed${NC}"
        echo -e "${RED}🔧 Scripts need additional robustness improvements${NC}"
    fi
    
    exit $exit_code
}

# Run main function
main "$@"