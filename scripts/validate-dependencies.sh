#!/bin/bash

# =============================================================================
# DEPENDENCY VALIDATION SCRIPT
# =============================================================================
# Standalone script to validate all dependencies for Adminer operations
# Can be run independently or called by other scripts
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

# Environment detection
detect_environment() {
    if [ -n "$CI" ]; then
        ENVIRONMENT="ci"
    elif [ -n "$VERCEL" ]; then
        ENVIRONMENT="vercel"
    else
        ENVIRONMENT="local"
    fi
    debug_log "Environment detected: $ENVIRONMENT"
}

# OS detection
detect_os() {
    case "$(uname -s)" in
        "Darwin") OS="macos" ;;
        "Linux")  OS="linux" ;;
        "CYGWIN"*) OS="windows" ;;
        *) OS="unknown" ;;
    esac
    debug_log "OS detected: $OS"
}

# Validate required commands
validate_commands() {
    local missing_deps=()
    
    debug_log "Validating required commands..."
    
    # Required commands
    for cmd in curl grep find; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        else
            debug_log "Command '$cmd' found"
        fi
    done
    
    # Optional commands
    for cmd in jq node npm git; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            debug_log "Optional command '$cmd' not found - continuing without it"
        else
            debug_log "Optional command '$cmd' found"
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required commands: ${missing_deps[*]}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ All required commands available${NC}"
    return 0
}

# Validate project structure
validate_project_structure() {
    local missing_dirs=()
    
    debug_log "Validating project structure..."
    
    # Check for essential directories
    local required_dirs=("adminer" "adminer/apps" "adminer/apps/api" "adminer/apps/web")
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            missing_dirs+=("$dir")
        else
            debug_log "Directory '$dir' found"
        fi
    done
    
    if [ ${#missing_dirs[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required directories: ${missing_dirs[*]}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Project structure valid${NC}"
    return 0
}

# Validate required scripts
validate_scripts() {
    local command="${1:-all}"
    local missing_scripts=()
    
    debug_log "Validating required scripts for command: $command"
    
    # Define required scripts by command
    local required_scripts=()
    case "$command" in
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
        "all")
            required_scripts=(
                "system_analysis_validator.sh"
                "super-deploy-pipeline.sh"
                "pure_static_fix.sh"
                "scripts/smoke.sh"
                "adminer_mvp_status_checker.sh"
            )
            ;;
    esac
    
    for script in "${required_scripts[@]}"; do
        if [ ! -f "$script" ]; then
            missing_scripts+=("$script")
        else
            debug_log "Script '$script' found"
        fi
    done
    
    if [ ${#missing_scripts[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required scripts: ${missing_scripts[*]}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ All required scripts available${NC}"
    return 0
}

# Main validation function
main() {
    echo -e "${BLUE}🔍 Adminer Dependency Validation${NC}"
    echo "=================================="
    
    # Detect environment and OS
    detect_environment
    detect_os
    
    echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
    echo -e "${BLUE}OS: $OS${NC}"
    echo ""
    
    # Run validations
    local exit_code=0
    
    echo -e "${BLUE}Validating commands...${NC}"
    if ! validate_commands; then
        exit_code=1
    fi
    
    echo -e "${BLUE}Validating project structure...${NC}"
    if ! validate_project_structure; then
        exit_code=1
    fi
    
    echo -e "${BLUE}Validating scripts...${NC}"
    if ! validate_scripts "$1"; then
        exit_code=1
    fi
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ All dependencies validated successfully${NC}"
    else
        echo -e "${RED}❌ Dependency validation failed${NC}"
    fi
    
    exit $exit_code
}

# Run main function with all arguments
main "$@"