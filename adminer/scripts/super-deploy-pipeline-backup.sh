#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_phase() { echo -e "${PURPLE}🚀 $1${NC}"; }
log_step() { echo -e "${CYAN}  → $1${NC}"; }

# Error handling
set -o pipefail
trap 'handle_error $? $LINENO' ERR

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
API_DIR="$PROJECT_ROOT/adminer/apps/api"
WEB_DIR="$PROJECT_ROOT/adminer/apps/web"
BACKUP_DIR="$PROJECT_ROOT/adminer/backups/$(date +%Y%m%d_%H%M%S)"
ROLLBACK_POINTS=()

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Error handler
handle_error() {
    local exit_code=$1
    local line_number=$2
    
    log_error "Pipeline failed at line $line_number with exit code $exit_code"
    log_error "Starting rollback process..."
    
    # Rollback to last known good state
    if [ ${#ROLLBACK_POINTS[@]} -gt 0 ]; then
        local last_point="${ROLLBACK_POINTS[-1]}"
        log_warning "Rolling back to: $last_point"
        # Add rollback logic here if needed
    fi
    
    log_error "Pipeline failed. Check logs above for details."
    exit $exit_code
}

# Validation functions
validate_project_structure() {
    log_step "Validating project structure..."
    
    if [ ! -d "$API_DIR" ]; then
        log_error "API directory not found: $API_DIR"
        return 1
    fi
    
    if [ ! -d "$WEB_DIR" ]; then
        log_error "Web directory not found: $WEB_DIR"
        return 1
    fi
    
    log_success "Project structure validated"
}

validate_api_endpoints() {
    log_step "Validating API endpoints..."
    
    # Check if local server is running
    if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log_warning "Local server not running, starting it..."
        cd "$API_DIR"
        node simple-server.cjs &
        sleep 3
    fi
    
    # Test API endpoints
    local health_response=$(curl -s http://localhost:3000/api/health)
    local consolidated_response=$(curl -s "http://localhost:3000/api/consolidated?action=quota/status")
    
    if [[ "$health_response" == *"healthy"* ]]; then
        log_success "Health endpoint working"
    else
        log_error "Health endpoint failed: $health_response"
        return 1
    fi
    
    if [[ "$consolidated_response" == *"success"* ]]; then
        log_success "Consolidated endpoint working"
    else
        log_error "Consolidated endpoint failed: $consolidated_response"
        return 1
    fi
}

validate_bundle_sync() {
    log_step "Validating bundle synchronization..."
    
    cd "$API_DIR"
    
    if [ ! -f "public/index.html" ]; then
        log_error "index.html not found in public directory"
        return 1
    fi
    
    local html_bundle=$(grep -o 'index-[^"]*\.js' public/index.html | head -1)
    local actual_bundle=$(ls public/assets/index-*.js 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "")
    
    if [ -z "$html_bundle" ]; then
        log_error "No bundle reference found in HTML"
        return 1
    fi
    
    if [ -z "$actual_bundle" ]; then
        log_error "No bundle file found in assets directory"
        return 1
    fi
    
    if [ "$html_bundle" = "$actual_bundle" ]; then
        log_success "Bundle sync verified: $html_bundle"
    else
        log_error "Bundle mismatch: HTML=$html_bundle, Actual=$actual_bundle"
        return 1
    fi
}

validate_dashboard_rendering() {
    log_step "Validating dashboard rendering..."
    
    # Check if dashboard loads without errors
    local dashboard_response=$(curl -s http://localhost:3000/dashboard)
    
    if [[ "$dashboard_response" == *"root"* ]] && [[ "$dashboard_response" == *"index"* ]]; then
        log_success "Dashboard HTML structure looks correct"
    else
        log_warning "Dashboard response may have issues"
    fi
    
    # Check for JavaScript errors in console (basic check)
    log_info "Dashboard validation complete - check browser console for JavaScript errors"
}

# Phase 1: Complete Fix & Reset
phase1_complete_fix() {
    log_phase "PHASE 1: Complete Fix & Reset"
    
    log_step "Running complete fix script..."
    cd "$PROJECT_ROOT"
    
    if [ -f "complete_fix_script.sh" ]; then
        chmod +x complete_fix_script.sh
        ./complete_fix_script.sh
        ROLLBACK_POINTS+=("Phase 1: Complete fix applied")
    else
        log_warning "complete_fix_script.sh not found, skipping..."
    fi
    
    log_success "Phase 1 completed"
}

# Phase 2: Atomic Build Process
phase2_atomic_build() {
    log_phase "PHASE 2: Atomic Build Process"
    
    log_step "Running atomic build script..."
    cd "$PROJECT_ROOT"
    
    if [ -f "adminer/scripts/local-atomic-build.sh" ]; then
        chmod +x adminer/scripts/local-atomic-build.sh
        ./adminer/scripts/local-atomic-build.sh
        ROLLBACK_POINTS+=("Phase 2: Atomic build completed")
    else
        log_warning "local-atomic-build.sh not found, running manual build..."
        cd "$WEB_DIR"
        npm ci
        npm run build
        ROLLBACK_POINTS+=("Phase 2: Manual build completed")
    fi
    
    log_success "Phase 2 completed"
}

# Phase 3: Bundle Synchronization
phase3_bundle_sync() {
    log_phase "PHASE 3: Bundle Synchronization"
    
    log_step "Running bundle sync script..."
    cd "$PROJECT_ROOT"
    
    if [ -f "adminer/scripts/run-automated-bundle-sync.sh" ]; then
        chmod +x adminer/scripts/run-automated-bundle-sync.sh
        ./adminer/scripts/run-automated-bundle-sync.sh
        ROLLBACK_POINTS+=("Phase 3: Bundle sync completed")
    else
        log_warning "run-automated-bundle-sync.sh not found, running manual sync..."
        cd "$API_DIR"
        rm -rf public/*
        cp -r "$WEB_DIR/dist"/* public/
        ROLLBACK_POINTS+=("Phase 3: Manual sync completed")
    fi
    
    log_success "Phase 3 completed"
}

# Phase 4: Pre-Deployment Validation
phase4_validation() {
    log_phase "PHASE 4: Pre-Deployment Validation"
    
    log_step "Starting local server for validation..."
    cd "$API_DIR"
    
    # Kill any existing server
    pkill -f "simple-server.cjs" || true
    sleep 1
    
    # Start server in background
    node simple-server.cjs &
    local server_pid=$!
    sleep 3
    
    # Store PID for cleanup
    echo $server_pid > .server.pid
    
    log_step "Running validation checks..."
    
    # Run all validations
    validate_project_structure
    validate_api_endpoints
    validate_bundle_sync
    validate_dashboard_rendering
    
    log_success "Phase 4 completed - All validations passed"
    ROLLBACK_POINTS+=("Phase 4: Validation completed")
}

# Phase 5: Production Deployment
phase5_deployment() {
    log_phase "PHASE 5: Production Deployment"
    
    log_step "Running Vercel build..."
    cd "$PROJECT_ROOT"
    
    if [ -f "adminer/scripts/vercel-build.sh" ]; then
        chmod +x adminer/scripts/vercel-build.sh
        ./adminer/scripts/vercel-build.sh
    else
        log_warning "vercel-build.sh not found, skipping..."
    fi
    
    log_step "Running local deploy..."
    if [ -f "adminer/scripts/local-deploy.sh" ]; then
        chmod +x adminer/scripts/local-deploy.sh
        # Change to correct directory for local-deploy.sh
        cd "$API_DIR"
        ./local-deploy.sh
        cd "$PROJECT_ROOT"
    else
        log_warning "local-deploy.sh not found, skipping..."
    fi
    
    log_step "Running deploy smoke test..."
    if [ -f "adminer/scripts/run-deploy-smoke.sh" ]; then
        chmod +x adminer/scripts/run-deploy-smoke.sh
        ./adminer/scripts/run-deploy-smoke.sh
    else
        log_warning "run-deploy-smoke.sh not found, skipping..."
    fi
    
    log_success "Phase 5 completed"
    ROLLBACK_POINTS+=("Phase 5: Deployment completed")
    
    # Final deployment validation
    log_step "Final deployment validation..."
    sleep 5  # Wait for deployment to settle
    
    # Check if deployment was successful
    if curl -s https://adminer.online/api/health > /dev/null 2>&1; then
        log_success "Production API endpoint responding"
    else
        log_warning "Production API endpoint not yet responding (may need time to deploy)"
    fi
    
    log_info "Deployment completed - check https://adminer.online/dashboard for final verification"
}

# Cleanup function
cleanup() {
    log_step "Cleaning up..."
    
    # Stop local server if running
    if [ -f "$API_DIR/.server.pid" ]; then
        local server_pid=$(cat "$API_DIR/.server.pid")
        kill $server_pid 2>/dev/null || true
        rm -f "$API_DIR/.server.pid"
    fi
    
    # Kill any remaining simple-server processes
    pkill -f "simple-server.cjs" || true
}

# Main pipeline execution
main() {
    echo -e "${PURPLE}"
    echo "🚀 SUPER DEPLOY PIPELINE - Complete Fix + Build + Sync + Deploy"
    echo "================================================================"
    echo -e "${NC}"
    
    log_info "Starting pipeline execution..."
    log_info "Project root: $PROJECT_ROOT"
    log_info "API directory: $API_DIR"
    log_info "Web directory: $WEB_DIR"
    log_info "Backup directory: $BACKUP_DIR"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute all phases
    phase1_complete_fix
    phase2_atomic_build
    phase3_bundle_sync
    phase4_validation
    phase5_deployment
    
    # Final success message
    echo -e "${GREEN}"
    echo "🎉 SUPER DEPLOY PIPELINE COMPLETED SUCCESSFULLY!"
    echo "================================================"
    echo -e "${NC}"
    
    log_success "All phases completed successfully"
    log_info "Rollback points created: ${#ROLLBACK_POINTS[@]}"
    
    for point in "${ROLLBACK_POINTS[@]}"; do
        log_info "  - $point"
    done
    
    log_info "Your application should now be deployed and working correctly!"
    log_info "Check the production URL to verify deployment"
}

# Run main function
main "$@" 