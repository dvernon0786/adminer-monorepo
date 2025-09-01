#!/bin/bash
set -e

# System Analysis & Validation Script
# Analyzes current working architecture and validates functionality
# CATCHES: Vercel deployment architecture mismatches, API function conflicts, and routing failures

PROJECT_ROOT="/home/dghost/Desktop/ADminerFinal"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

echo "=============================================="
echo "ADMINER SYSTEM ANALYSIS & VALIDATION SUITE"
echo "=============================================="
echo "Timestamp: $(date)"
echo "Project Root: $PROJECT_ROOT"
echo ""

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local description="$3"
    
    echo -n "Testing: $test_name... "
    
    if eval "$test_command" &>/dev/null; then
        echo -e "${GREEN}PASS${NC}"
        [ -n "$description" ] && echo "  └─ $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        [ -n "$description" ] && echo "  └─ $description"
        ((TESTS_FAILED++))
        FAILED_TESTS+=("$test_name")
        return 1
    fi
}

# Function to analyze file structure
analyze_file_structure() {
    echo -e "${BLUE}=== FILE STRUCTURE ANALYSIS ===${NC}"
    
    # Core directories
    echo "Core Directory Structure:"
    [ -d "$PROJECT_ROOT/adminer/apps/web" ] && echo "  ✓ Web App Directory: EXISTS" || echo "  ✗ Web App Directory: MISSING"
    [ -d "$PROJECT_ROOT/adminer/apps/api" ] && echo "  ✓ API Directory: EXISTS" || echo "  ✗ API Directory: MISSING"
    
    # Build outputs
    echo "Build Output Analysis:"
    [ -d "$PROJECT_ROOT/adminer/apps/web/dist" ] && echo "  ✓ Web Build: EXISTS" || echo "  ✗ Web Build: MISSING"
    [ -d "$PROJECT_ROOT/adminer/apps/api/public" ] && echo "  ✓ API Public: EXISTS" || echo "  ✗ API Public: MISSING"
    
    # Configuration files
    echo "Configuration Files:"
    [ -f "$PROJECT_ROOT/adminer/apps/web/vite.config.ts" ] && echo "  ✓ Vite Config: EXISTS" || echo "  ✗ Vite Config: MISSING"
    [ -f "$PROJECT_ROOT/adminer/apps/api/vercel.json" ] && echo "  ✓ Vercel Config: EXISTS" || echo "  ✗ Vercel Config: MISSING"
    
    # Server files analysis
    echo "Server Files Analysis:"
    if [ -f "$PROJECT_ROOT/adminer/apps/api/simple-server.cjs" ]; then
        echo "  ✓ Primary Server: simple-server.cjs ($(stat -f%z "$PROJECT_ROOT/adminer/apps/api/simple-server.cjs" 2>/dev/null || stat -c%s "$PROJECT_ROOT/adminer/apps/api/simple-server.cjs") bytes)"
    else
        echo "  ✗ Primary Server: MISSING"
    fi
    
    if [ -f "$PROJECT_ROOT/adminer/apps/api/local-server.cjs" ]; then
        echo "  ⚠ Duplicate Server: local-server.cjs (SHOULD BE CLEANED UP)"
    fi
    
    # Dashboard components analysis
    echo "Dashboard Components Analysis:"
    cd "$PROJECT_ROOT/adminer/apps/web/src/pages/dashboard" 2>/dev/null || { echo "  ✗ Dashboard directory not found"; return; }
    
    echo "  Production Components:"
    [ -f "index.tsx" ] && echo "    ✓ Main Dashboard: index.tsx ($(wc -l < index.tsx) lines)" || echo "    ✗ Main Dashboard: MISSING"
    
    echo "  Debug Components (SHOULD BE CLEANED):"
    [ -f "force-red.tsx" ] && echo "    ⚠ Debug Component: force-red.tsx ($(wc -l < force-red.tsx) lines)"
    [ -f "css-test.tsx" ] && echo "    ⚠ Debug Component: css-test.tsx ($(wc -l < css-test.tsx) lines)"
    [ -f "simple.tsx" ] && echo "    ⚠ Debug Component: simple.tsx ($(wc -l < simple.tsx) lines)"
    [ -f "minimal.tsx" ] && echo "    ⚠ Debug Component: minimal.tsx ($(wc -l < minimal.tsx) lines)"
    
    # Bundle analysis
    echo "Bundle Analysis:"
    cd "$PROJECT_ROOT/adminer/apps/api/public/assets" 2>/dev/null || { echo "  ✗ Assets directory not found"; return; }
    
    JS_BUNDLE=$(ls index-*.js 2>/dev/null | head -1)
    CSS_BUNDLE=$(ls index-*.css 2>/dev/null | head -1)
    
    if [ -n "$JS_BUNDLE" ]; then
        echo "  ✓ JavaScript Bundle: $JS_BUNDLE ($(stat -f%z "$JS_BUNDLE" 2>/dev/null || stat -c%s "$JS_BUNDLE") bytes)"
    else
        echo "  ✗ JavaScript Bundle: NOT FOUND"
    fi
    
    if [ -n "$CSS_BUNDLE" ]; then
        echo "  ✓ CSS Bundle: $CSS_BUNDLE ($(stat -f%z "$CSS_BUNDLE" 2>/dev/null || stat -c%s "$CSS_BUNDLE") bytes)"
    else
        echo "  ✗ CSS Bundle: NOT FOUND"
    fi
    
    # Check bundle references in HTML
    cd "$PROJECT_ROOT/adminer/apps/api/public" 2>/dev/null || return
    if [ -f "index.html" ]; then
        HTML_JS_REF=$(grep -o 'index-[^"]*\.js' index.html || echo "NONE")
        HTML_CSS_REF=$(grep -o 'index-[^"]*\.css' index.html || echo "NONE")
        
        echo "  Bundle Reference Check:"
        echo "    HTML references JS: $HTML_JS_REF"
        echo "    Actual JS file: $JS_BUNDLE"
        if [ "$HTML_JS_REF" = "$JS_BUNDLE" ]; then
            echo "    ✓ Bundle references MATCH"
        else
            echo "    ✗ Bundle references MISMATCH"
        fi
    fi
    
    echo ""
}

# Function to test local development server
test_local_server() {
    echo -e "${BLUE}=== LOCAL DEVELOPMENT SERVER TESTS ===${NC}"
    
    cd "$PROJECT_ROOT/adminer/apps/api"
    
    # Check if server file exists
    run_test "Server file exists" \
        "[ -f 'simple-server.cjs' ]" \
        "Checking for primary server file"
    
    # Start server in background
    echo "Starting local server..."
    pkill -f simple-server || true
    sleep 2
    node simple-server.cjs &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test server endpoints
    run_test "Homepage loads" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ | grep -q '200'" \
        "Testing homepage accessibility"
    
    run_test "Dashboard route accessible" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/dashboard | grep -q '200'" \
        "Testing dashboard routing"
    
    run_test "API health endpoint" \
        "curl -s http://localhost:3000/api/health | grep -q 'status'" \
        "Testing API health check"
    
    run_test "API consolidated endpoint" \
        "curl -s 'http://localhost:3000/api/consolidated?action=quota' | grep -q 'current'" \
        "Testing quota API functionality"
    
    # Test static asset serving
    run_test "JavaScript bundle serves" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/assets/index-*.js | head -1 | grep -q '200'" \
        "Testing JavaScript bundle accessibility"
    
    run_test "CSS bundle serves" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/assets/index-*.css | head -1 | grep -q '200'" \
        "Testing CSS bundle accessibility"
    
    # Clean up server
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
    
    echo ""
}

# Function to test build process
test_build_process() {
    echo -e "${BLUE}=== BUILD PROCESS VALIDATION ===${NC}"
    
    cd "$PROJECT_ROOT/adminer/apps/web"
    
    # Test Vite build
    run_test "Vite build succeeds" \
        "npm run build" \
        "Testing Vite build process"
    
    run_test "Build output exists" \
        "[ -d 'dist' ] && [ -f 'dist/index.html' ]" \
        "Checking build output directory"
    
    run_test "Assets directory exists" \
        "[ -d 'dist/assets' ]" \
        "Checking assets compilation"
    
    # Test file copying process
    cd "$PROJECT_ROOT/adminer/apps/api"
    
    run_test "File copy process" \
        "cp -r ../web/dist/* public/ 2>/dev/null" \
        "Testing file copy from web to api"
    
    run_test "Public directory populated" \
        "[ -f 'public/index.html' ] && [ -d 'public/assets' ]" \
        "Verifying copied files"
    
    echo ""
}

# Function to test production deployment readiness
test_production_readiness() {
    echo -e "${BLUE}=== PRODUCTION DEPLOYMENT TESTS ===${NC}"
    
    cd "$PROJECT_ROOT/adminer/apps/api"
    
    # Check Vercel configuration
    run_test "Vercel config exists" \
        "[ -f 'vercel.json' ]" \
        "Checking Vercel deployment configuration"
    
    run_test "Vercel config valid JSON" \
        "jq empty vercel.json 2>/dev/null || python -m json.tool vercel.json >/dev/null 2>&1" \
        "Validating JSON syntax"
    
    # Validate Vercel configuration content
    echo "Validating Vercel configuration content:"
    
    run_test "Functions runtime validation" \
        "validate_vercel_functions_runtime" \
        "Checking function runtime specifications"
    
    run_test "Vercel build command validation" \
        "validate_vercel_build_config" \
        "Validating build configuration"
    
    run_test "Vercel routes validation" \
        "validate_vercel_routes" \
        "Checking route configurations"
    
    run_test "Deployment architecture consistency" \
        "validate_deployment_architecture" \
        "Validating API functions vs static deployment setup"
    
    run_test "Node.js version compatibility" \
        "validate_nodejs_version" \
        "Checking Node.js version support"
    
    # Test Vercel CLI deployment validation (dry run)
    if command -v vercel >/dev/null 2>&1; then
        echo "Testing Vercel CLI validation:"
        run_test "Vercel build dry run" \
            "timeout 30 vercel build --debug 2>&1 | tee /tmp/vercel_build_test.log; ! grep -i 'error' /tmp/vercel_build_test.log" \
            "Testing Vercel build process validation"
    else
        echo "  ⚠ Vercel CLI not available - skipping build validation"
    fi
    
    # Check environment variables (if .env.local exists)
    if [ -f ".env.local" ]; then
        run_test "Environment variables file" \
            "[ -s '.env.local' ]" \
            "Checking environment variables file"
    fi
    
    # Check public directory structure
    run_test "Production files ready" \
        "[ -f 'public/index.html' ] && [ -d 'public/assets' ]" \
        "Verifying production-ready files"
    
    # Test production URL (if accessible)
    echo "Testing production deployment (if accessible):"
    if curl -s --connect-timeout 10 https://adminer.online/dashboard >/dev/null 2>&1; then
        run_test "Production dashboard loads" \
            "curl -s -o /dev/null -w '%{http_code}' https://adminer.online/dashboard | grep -q '200'" \
            "Testing live production dashboard"
        
        run_test "Production API accessible" \
            "curl -s https://adminer.online/api/health | grep -q 'status'" \
            "Testing live production API"
    else
        echo "  ⚠ Production URL not accessible (may be expected)"
    fi
    
    echo ""
}

# Function to validate Vercel functions runtime
validate_vercel_functions_runtime() {
    if [ ! -f "vercel.json" ]; then
        return 1
    fi
    
    # Check if functions are defined and have valid runtime
    if jq -e '.functions' vercel.json >/dev/null 2>&1; then
        # Check each function runtime
        jq -r '.functions[] | select(.runtime) | .runtime' vercel.json 2>/dev/null | while read -r runtime; do
            case "$runtime" in
                "nodejs18.x"|"nodejs20.x"|"@vercel/node@"*|"@vercel/python@"*|"@vercel/go@"*)
                    continue
                    ;;
                *)
                    echo "Invalid runtime: $runtime" >&2
                    return 1
                    ;;
            esac
        done
    fi
    
    return 0
}

# Function to validate Vercel build configuration
validate_vercel_build_config() {
    if [ ! -f "vercel.json" ]; then
        return 1
    fi
    
    # Check build command exists and is valid
    if jq -e '.buildCommand' vercel.json >/dev/null 2>&1; then
        BUILD_CMD=$(jq -r '.buildCommand' vercel.json)
        case "$BUILD_CMD" in
            ""|"null")
                return 0  # Empty build command is valid for static sites
                ;;
            *)
                # Validate that build command doesn't contain dangerous operations
                if echo "$BUILD_CMD" | grep -E "(rm -rf|sudo|curl.*sh)" >/dev/null; then
                    return 1
                fi
                return 0
                ;;
        esac
    fi
    
    return 0
}

# Function to validate Vercel routes
validate_vercel_routes() {
    if [ ! -f "vercel.json" ]; then
        return 1
    fi
    
    # Check rewrites syntax
    if jq -e '.rewrites' vercel.json >/dev/null 2>&1; then
        # Validate rewrite patterns
        jq -e '.rewrites[] | select(.source and .destination)' vercel.json >/dev/null 2>&1
    else
        return 0  # No rewrites is valid
    fi
}

# Function to validate deployment architecture consistency
validate_deployment_architecture() {
    echo "Validating deployment architecture consistency:"
    
    # Check if we have API functions
    local has_api_functions=false
    if [ -d "api" ] && [ "$(ls -A api 2>/dev/null)" ]; then
        has_api_functions=true
        echo "  ✓ API functions detected: $(ls api/*.js 2>/dev/null | wc -l) files"
    fi
    
    # Check build command
    local build_command=""
    if [ -f "vercel.json" ] && jq -e '.buildCommand' vercel.json >/dev/null 2>&1; then
        build_command=$(jq -r '.buildCommand' vercel.json)
    fi
    
    # Check for architecture mismatch
    if [ "$has_api_functions" = true ] && [ -f "package.json" ]; then
        local build_cmd_from_pkg=$(jq -r '.scripts.build // empty' package.json 2>/dev/null)
        
        # If we have API functions but build command suggests static-only
        if [[ "$build_command" == *"pre-built files"* ]] || [[ "$build_cmd_from_pkg" == *"pre-built files"* ]]; then
            echo "  ✗ ARCHITECTURE MISMATCH: API functions present but static-only build configured"
            echo "    This will cause 'No entrypoint found' errors in Vercel"
            return 1
        fi
    fi
    
    # Check public directory structure vs API functions
    if [ "$has_api_functions" = true ] && [ -d "public" ]; then
        echo "  ⚠ WARNING: Both API functions and public directory present"
        echo "    This mixed architecture may cause deployment routing issues"
        echo "    Consider consolidating to either pure static or pure serverless"
    fi
    
    return 0
}

# Function to validate Node.js version compatibility
validate_nodejs_version() {
    # Check package.json engines
    for pkg_json in package.json ../web/package.json ../../package.json; do
        if [ -f "$pkg_json" ]; then
            local node_version=$(jq -r '.engines.node // empty' "$pkg_json" 2>/dev/null)
            if [ -n "$node_version" ]; then
                case "$node_version" in
                    "18.x"|"18"|"^18")
                        echo "  ✗ Node.js $node_version is deprecated (will fail after Sept 1, 2025)"
                        return 1
                        ;;
                    "22.x"|"22"|"^22"|"20.x"|"20"|"^20")
                        echo "  ✓ Node.js $node_version is supported"
                        ;;
                    *)
                        echo "  ⚠ Node.js version $node_version may not be supported"
                        ;;
                esac
            fi
        fi
    done
    return 0
}

# Function to identify cleanup opportunities
identify_cleanup() {
    echo -e "${BLUE}=== CLEANUP OPPORTUNITIES ===${NC}"
    
    echo "Files that should be cleaned up:"
    
    # Debug components
    cd "$PROJECT_ROOT/adminer/apps/web/src/pages/dashboard" 2>/dev/null || return
    for debug_file in force-red.tsx css-test.tsx simple.tsx minimal.tsx; do
        if [ -f "$debug_file" ]; then
            echo "  ⚠ Debug Component: $debug_file ($(wc -l < "$debug_file") lines) - SHOULD BE REMOVED"
        fi
    done
    
    # Duplicate server files
    cd "$PROJECT_ROOT/adminer/apps/api"
    if [ -f "local-server.cjs" ]; then
        echo "  ⚠ Duplicate Server: local-server.cjs - SHOULD BE CONSOLIDATED"
    fi
    
    # Backup configurations
    if [ -f "vercel.json.backup" ]; then
        echo "  ⚠ Backup Config: vercel.json.backup - SHOULD BE REMOVED"
    fi
    
    # Debug scripts
    if [ -f "enhanced_dashboard_fix.sh" ]; then
        echo "  ⚠ Debug Script: enhanced_dashboard_fix.sh - SHOULD BE REMOVED"
    fi
    
    # Force deploy files
    for force_file in force-deploy-*.txt; do
        if [ -f "$force_file" ]; then
            echo "  ⚠ Force Deploy: $force_file - SHOULD BE REMOVED"
        fi
    done
    
    echo ""
}

# Function to create backup
create_backup() {
    echo -e "${BLUE}=== CREATING WORKING STATE BACKUP ===${NC}"
    
    BACKUP_DIR="$PROJECT_ROOT/backups/working_state_$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    
    # Backup critical directories
    cp -r "$PROJECT_ROOT/adminer/apps/web/src" "$BACKUP_DIR/web_src_backup" 2>/dev/null || echo "  ⚠ Could not backup web src"
    cp -r "$PROJECT_ROOT/adminer/apps/api/public" "$BACKUP_DIR/api_public_backup" 2>/dev/null || echo "  ⚠ Could not backup api public"
    
    # Backup configuration files
    cp "$PROJECT_ROOT/adminer/apps/web/package.json" "$BACKUP_DIR/web_package.json" 2>/dev/null || echo "  ⚠ Could not backup web package.json"
    cp "$PROJECT_ROOT/adminer/apps/api/package.json" "$BACKUP_DIR/api_package.json" 2>/dev/null || echo "  ⚠ Could not backup api package.json"
    cp "$PROJECT_ROOT/adminer/apps/web/vite.config.ts" "$BACKUP_DIR/vite.config.ts" 2>/dev/null || echo "  ⚠ Could not backup vite config"
    cp "$PROJECT_ROOT/adminer/apps/api/vercel.json" "$BACKUP_DIR/vercel.json" 2>/dev/null || echo "  ⚠ Could not backup vercel config"
    cp "$PROJECT_ROOT/adminer/apps/api/simple-server.cjs" "$BACKUP_DIR/simple-server.cjs" 2>/dev/null || echo "  ⚠ Could not backup server"
    
    echo "Backup created at: $BACKUP_DIR"
    echo "$BACKUP_DIR" > "$PROJECT_ROOT/.last_working_backup"
    echo ""
}

# Function to display summary
display_summary() {
    echo -e "${BLUE}=== VALIDATION SUMMARY ===${NC}"
    echo "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo "Tests Failed: ${RED}$TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -gt 0 ]; then
        echo ""
        echo "Failed Tests:"
        for test in "${FAILED_TESTS[@]}"; do
            echo "  ✗ $test"
        done
        echo ""
        echo -e "${RED}COMMIT BLOCKED - Fix failed tests before committing${NC}"
        exit 1
    else
        echo ""
        echo -e "${GREEN}ALL TESTS PASSED - SYSTEM IS STABLE${NC}"
        echo -e "${GREEN}Safe to commit changes${NC}"
        exit 0
    fi
}

# Main execution
main() {
    # Change to project root
    cd "$PROJECT_ROOT" || { echo "Project root not found"; exit 1; }
    
    # Create backup of current working state
    create_backup
    
    # Analyze current file structure
    analyze_file_structure
    
    # Test local development server
    test_local_server
    
    # Test build process
    test_build_process
    
    # Test production readiness
    test_production_readiness
    
    # Identify cleanup opportunities
    identify_cleanup
    
    # Display final summary
}

# Execute main function
main "$@" 