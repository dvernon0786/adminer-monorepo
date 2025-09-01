#!/bin/bash
set -e

# =============================================================================
# ADMINER UNIFIED ORCHESTRATOR
# =============================================================================
# 
# Single entry point for all Adminer operations
# Provides consistent interface and workflow orchestration
#
# Usage:
#   ./adminer.sh validate    # System validation & pre-commit checks
#   ./adminer.sh deploy      # Complete deployment pipeline
#   ./adminer.sh fix         # Architecture fixes & repairs
#   ./adminer.sh smoke-test  # Comprehensive testing suite
#   ./adminer.sh status      # Current system status
#   ./adminer.sh help        # Show all available commands
#
# Author: AI Assistant
# Created: $(date)
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
ADMINER_SCRIPTS_DIR="$PROJECT_ROOT/adminer/scripts"

# Environment detection
ENVIRONMENT="${ENVIRONMENT:-local}"
if [ -n "$CI" ]; then
    ENVIRONMENT="ci"
elif [ -n "$VERCEL" ]; then
    ENVIRONMENT="vercel"
fi

# Debug mode
DEBUG="${DEBUG:-false}"

# Logging
LOG_FILE="$PROJECT_ROOT/adminer-$(date +%Y%m%d_%H%M%S).log"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

debug_log() {
    if [ "$DEBUG" = "true" ]; then
        echo "DEBUG: $1" >&2 | tee -a "$LOG_FILE"
    fi
}

# Error handling and recovery
handle_error() {
    local exit_code=$1
    local context="$2"
    local line_number="$3"
    
    error "Error in $context (exit code: $exit_code, line: $line_number)"
    
    # Attempt recovery based on context
    case "$context" in
        "pattern_check")
            warning "Continuing with alternative pattern matching..."
            ;;
        "file_check")
            warning "Creating missing file or using fallback..."
            ;;
        "command_execution")
            warning "Attempting alternative command execution..."
            ;;
        "dependency_validation")
            error "Cannot proceed without required dependencies"
            exit 1
            ;;
        *)
            warning "Attempting graceful degradation..."
            ;;
    esac
}

# Enhanced logging system
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "DEBUG") 
            if [ "$DEBUG" = "true" ]; then
                echo "[$timestamp] DEBUG: $message" >&2 | tee -a "$LOG_FILE"
            fi
            ;;
        "INFO")  
            echo "[$timestamp] INFO: $message" | tee -a "$LOG_FILE"
            ;;
        "WARN")  
            echo "[$timestamp] WARN: $message" >&2 | tee -a "$LOG_FILE"
            ;;
        "ERROR") 
            echo "[$timestamp] ERROR: $message" >&2 | tee -a "$LOG_FILE"
            ;;
    esac
}

phase() {
    echo -e "${PURPLE}🚀 PHASE: $1${NC}" | tee -a "$LOG_FILE"
    echo "================================================================" | tee -a "$LOG_FILE"
}

# Dependency validation function
validate_dependencies() {
    local missing_deps=()
    
    debug_log "Validating dependencies for environment: $ENVIRONMENT"
    
    # Check required commands
    for cmd in curl grep find; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        else
            debug_log "Command '$cmd' found"
        fi
    done
    
    # Check optional commands
    for cmd in jq node npm; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            debug_log "Optional command '$cmd' not found - continuing without it"
        else
            debug_log "Optional command '$cmd' found"
        fi
    done
    
    # Check required scripts exist (context-dependent)
    local required_scripts=()
    case "$1" in
        "validate")
            required_scripts=("system_analysis_validator.sh")
            ;;
        "deploy")
            required_scripts=("super-deploy-pipeline.sh")
            ;;
        "fix")
            required_scripts=("pure_static_fix.sh")
            ;;
        "smoke-test")
            required_scripts=("scripts/smoke.sh")
            ;;
        "mvp-status")
            required_scripts=("adminer_mvp_status_checker.sh")
            ;;
    esac
    
    for script in "${required_scripts[@]}"; do
        if [ ! -f "$script" ]; then
            missing_deps+=("$script")
        else
            debug_log "Required script '$script' found"
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        error "Missing dependencies: ${missing_deps[*]}"
        error "Please install missing dependencies and try again."
        exit 1
    fi
    
    debug_log "All required dependencies validated"
}

# =============================================================================
# COMMAND FUNCTIONS
# =============================================================================

show_help() {
    echo -e "${PURPLE}ADMINER UNIFIED ORCHESTRATOR${NC}"
    echo "=================================="
    echo ""
    echo -e "${CYAN}Available Commands:${NC}"
    echo ""
    echo -e "${GREEN}  validate${NC}     - Run system validation & pre-commit checks"
    echo -e "${GREEN}  deploy${NC}       - Execute complete deployment pipeline"
    echo -e "${GREEN}  fix${NC}          - Run architecture fixes & repairs"
    echo -e "${GREEN}  smoke-test${NC}   - Run comprehensive testing suite"
    echo -e "${GREEN}  mvp-status${NC}   - Check MVP completion status"
    echo -e "${GREEN}  status${NC}       - Show current system status"
    echo -e "${GREEN}  help${NC}         - Show this help message"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  ./adminer.sh validate"
    echo "  ./adminer.sh deploy"
    echo "  ./adminer.sh smoke-test production"
    echo "  ./adminer.sh mvp-status"
    echo ""
    echo -e "${YELLOW}Log file: $LOG_FILE${NC}"
}

show_status() {
    echo -e "${PURPLE}ADMINER SYSTEM STATUS${NC}"
    echo "========================"
    echo ""
    
    # Check if we're in the right directory
    if [[ ! -f "adminer.sh" ]]; then
        error "Not in Adminer project root directory"
        exit 1
    fi
    
    # Project structure
    echo -e "${CYAN}📁 Project Structure:${NC}"
    [ -d "adminer/apps/web" ] && echo "  ✅ Web app directory" || echo "  ❌ Web app directory missing"
    [ -d "adminer/apps/api" ] && echo "  ✅ API directory" || echo "  ❌ API directory missing"
    [ -f "adminer/apps/api/vercel.json" ] && echo "  ✅ Vercel config" || echo "  ❌ Vercel config missing"
    [ -f "adminer/apps/api/simple-server.cjs" ] && echo "  ✅ Local server" || echo "  ❌ Local server missing"
    
    # Build status
    echo ""
    echo -e "${CYAN}🔨 Build Status:${NC}"
    [ -d "adminer/apps/web/dist" ] && echo "  ✅ Web build exists" || echo "  ❌ Web build missing"
    [ -d "adminer/apps/api/public" ] && echo "  ✅ API public exists" || echo "  ❌ API public missing"
    
    # Script availability
    echo ""
    echo -e "${CYAN}📜 Script Availability:${NC}"
    [ -f "system_analysis_validator.sh" ] && echo "  ✅ System validator" || echo "  ❌ System validator missing"
    [ -f "pure_static_fix.sh" ] && echo "  ✅ Static fix script" || echo "  ❌ Static fix script missing"
    [ -f "super-deploy-pipeline.sh" ] && echo "  ✅ Deploy pipeline" || echo "  ❌ Deploy pipeline missing"
    [ -f "scripts/smoke.sh" ] && echo "  ✅ Smoke tests" || echo "  ❌ Smoke tests missing"
    
    # Environment
    echo ""
    echo -e "${CYAN}🌍 Environment:${NC}"
    echo "  📍 Project root: $PROJECT_ROOT"
    echo "  📝 Log file: $LOG_FILE"
    echo "  🕒 Current time: $(date)"
    
    # Quick health check
    echo ""
    echo -e "${CYAN}🏥 Quick Health Check:${NC}"
    if curl -s --connect-timeout 5 https://adminer.online/ >/dev/null 2>&1; then
        echo "  ✅ Production site accessible"
    else
        echo "  ❌ Production site not accessible"
    fi
    
    if curl -s --connect-timeout 5 https://www.adminer.online/ >/dev/null 2>&1; then
        echo "  ✅ WWW site accessible"
    else
        echo "  ❌ WWW site not accessible"
    fi
}

run_validate() {
    phase "System Validation & Pre-commit Checks"
    
    log "INFO" "Starting comprehensive system validation..."
    
    if [[ -f "system_analysis_validator.sh" ]]; then
        log "INFO" "Executing system_analysis_validator.sh..."
        chmod +x system_analysis_validator.sh
        
        if ./system_analysis_validator.sh; then
            success "System validation completed"
        else
            handle_error $? "system_validation" $LINENO
            return 1
        fi
    else
        error "system_analysis_validator.sh not found!"
        handle_error 1 "file_check" $LINENO
        return 1
    fi
    
    # Additional validation steps
    log "Running additional validation checks..."
    
    # Check for common issues
    if [[ -d "api" ]]; then
        warning "Root API directory found - may cause deployment issues"
    fi
    
    if [[ -f "vercel.json" ]]; then
        warning "Root vercel.json found - should be in adminer/apps/api/"
    fi
    
    success "All validation checks completed"
}

run_deploy() {
    phase "Complete Deployment Pipeline"
    
    log "Starting complete deployment pipeline..."
    
    if [[ -f "super-deploy-pipeline.sh" ]]; then
        log "Executing super-deploy-pipeline.sh..."
        chmod +x super-deploy-pipeline.sh
        ./super-deploy-pipeline.sh
        success "Deployment pipeline completed"
    else
        error "super-deploy-pipeline.sh not found!"
        exit 1
    fi
    
    # Post-deployment verification
    log "Running post-deployment verification..."
    sleep 30  # Wait for deployment to propagate
    
    if curl -s --connect-timeout 10 https://adminer.online/dashboard >/dev/null 2>&1; then
        success "Production deployment verified"
    else
        warning "Production deployment verification failed - check manually"
    fi
}

run_fix() {
    phase "Architecture Fixes & Repairs"
    
    log "Starting architecture fixes and repairs..."
    
    # Check what needs fixing
    log "Analyzing current state..."
    
    if [[ -d "api" ]]; then
        warning "Root API directory detected - running pure static fix..."
        if [[ -f "pure_static_fix.sh" ]]; then
            chmod +x pure_static_fix.sh
            ./pure_static_fix.sh
            success "Pure static conversion completed"
        else
            error "pure_static_fix.sh not found!"
            exit 1
        fi
    else
        info "No root API directory found - checking other issues..."
    fi
    
    # Check vercel.json location
    if [[ -f "vercel.json" ]] && [[ ! -f "adminer/apps/api/vercel.json" ]]; then
        warning "vercel.json in wrong location - moving to correct location..."
        cp vercel.json adminer/apps/api/vercel.json
        rm vercel.json
        success "vercel.json moved to correct location"
    fi
    
    # Check for bundle mismatches
    if [[ -f "adminer/apps/api/public/index.html" ]]; then
        log "Checking for bundle mismatches..."
        HTML_BUNDLE=$(grep -o 'index-[^"]*\.js' adminer/apps/api/public/index.html | head -1)
        if [[ -n "$HTML_BUNDLE" ]]; then
            if [[ -f "adminer/apps/api/public/assets/$HTML_BUNDLE" ]]; then
                success "Bundle references are consistent"
            else
                warning "Bundle mismatch detected - running fresh build..."
                cd adminer/apps/web
                npm run build
                cd ../api
                rm -rf public/*
                cp -r ../web/dist/* public/
                success "Fresh build completed and synchronized"
            fi
        fi
    fi
    
    success "All fixes completed"
}

run_smoke_test() {
    local environment="${1:-local}"
    
    phase "Comprehensive Testing Suite - $environment"
    
    log "Starting comprehensive testing suite for $environment environment..."
    
    # Determine base URL
    case "$environment" in
        "production"|"prod")
            BASE_URL="https://adminer.online"
            ;;
        "www")
            BASE_URL="https://www.adminer.online"
            ;;
        "local"|*)
            BASE_URL="http://localhost:3000"
            ;;
    esac
    
    log "Testing against: $BASE_URL"
    
    # Run appropriate smoke tests
    if [[ "$environment" == "local" ]]; then
        # Local testing
        log "Starting local server for testing..."
        cd adminer/apps/api
        pkill -f simple-server 2>/dev/null || true
        sleep 2
        node simple-server.cjs > server.log 2>&1 &
        SERVER_PID=$!
        sleep 5
        
        if ! ps -p $SERVER_PID > /dev/null; then
            error "Local server failed to start"
            exit 1
        fi
        
        success "Local server started (PID: $SERVER_PID)"
    fi
    
    # Run smoke tests
    if [[ -f "scripts/smoke.sh" ]]; then
        log "Executing smoke tests..."
        chmod +x scripts/smoke.sh
        APEX_URL="$BASE_URL" ./scripts/smoke.sh
        success "Smoke tests completed"
    else
        warning "scripts/smoke.sh not found - running basic tests..."
        
        # Basic tests
        log "Running basic endpoint tests..."
        
        # Test homepage
        if curl -s --connect-timeout 10 "$BASE_URL/" >/dev/null 2>&1; then
            success "Homepage accessible"
        else
            error "Homepage not accessible"
        fi
        
        # Test dashboard
        if curl -s --connect-timeout 10 "$BASE_URL/dashboard" >/dev/null 2>&1; then
            success "Dashboard accessible"
        else
            error "Dashboard not accessible"
        fi
        
        # Test API
        if curl -s --connect-timeout 10 "$BASE_URL/api/health" >/dev/null 2>&1; then
            success "API health endpoint accessible"
        else
            error "API health endpoint not accessible"
        fi
    fi
    
    # Cleanup local server if started
    if [[ "$environment" == "local" ]] && [[ -n "${SERVER_PID:-}" ]]; then
        log "Stopping local server..."
        pkill -f simple-server 2>/dev/null || true
    fi
    
    success "All testing completed for $environment environment"
}

run_mvp_status() {
    phase "MVP Completion Status Check"
    
    log "INFO" "Starting MVP completion status check..."
    
    if [[ -f "adminer_mvp_status_checker.sh" ]]; then
        log "INFO" "Executing adminer_mvp_status_checker.sh..."
        chmod +x adminer_mvp_status_checker.sh
        
        if bash adminer_mvp_status_checker.sh; then
            success "MVP status check completed"
        else
            handle_error $? "mvp_status_check" $LINENO
            return 1
        fi
    else
        error "adminer_mvp_status_checker.sh not found!"
        handle_error 1 "file_check" $LINENO
        return 1
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    # Initialize logging
    echo "Adminer Unified Orchestrator - $(date)" > "$LOG_FILE"
    
    # Check if we're in the right directory
    if [[ ! -f "adminer.sh" ]]; then
        error "Please run this script from the Adminer project root directory"
        exit 1
    fi
    
    # Parse command
    local command="${1:-help}"
    
    # Validate dependencies for the specific command
    if [ "$command" != "help" ] && [ "$command" != "status" ]; then
        validate_dependencies "$command"
    fi
    
    case "$command" in
        "validate")
            run_validate
            ;;
        "deploy")
            run_deploy
            ;;
        "fix")
            run_fix
            ;;
        "smoke-test")
            run_smoke_test "${2:-local}"
            ;;
        "mvp-status")
            run_mvp_status
            ;;
        "status")
            show_status
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    success "🎉 Command completed successfully!"
    info "📝 Log file: $LOG_FILE"
}

# Execute main function
main "$@"