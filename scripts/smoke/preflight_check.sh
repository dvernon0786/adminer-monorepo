#!/bin/bash
set -euo pipefail

# Adminer Inngest Billing System - Preflight Checklist
# Run this before starting the smoke test to catch common issues early

echo "🔍 === ADMINER INNGEST BILLING SYSTEM - PREFLIGHT CHECK ==="
echo "📍 Working directory: $(pwd)"
echo "⏰ Started at: $(date)"
echo

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for colored output
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Track overall status
PASSED=0
FAILED=0
WARNINGS=0

# Function to check command availability
check_command() {
    local cmd=$1
    local name=${2:-$1}
    if command -v "$cmd" >/dev/null 2>&1; then
        log_success "$name is available"
        ((PASSED++))
    else
        log_error "$name is not available"
        ((FAILED++))
    fi
}

# Function to check file existence
check_file() {
    local file=$1
    local name=${2:-$file}
    if [[ -f "$file" ]]; then
        log_success "$name exists"
        ((PASSED++))
    else
        log_error "$name is missing"
        ((FAILED++))
    fi
}

# Function to check environment variable
check_env_var() {
    local var=$1
    local name=${2:-$var}
    if [[ -n "${!var:-}" ]]; then
        log_success "$name is set"
        ((PASSED++))
    else
        log_warning "$name is not set"
        ((WARNINGS++))
    fi
}

echo "🔧 === STEP 0: TOOLING CHECK ==="
log_info "Checking required tools..."

check_command "psql" "PostgreSQL client (psql)"
check_command "jq" "JSON processor (jq)"
check_command "node" "Node.js"
check_command "npm" "npm package manager"

if command -v node >/dev/null 2>&1; then
    log_info "Node.js version: $(node -v)"
fi

if command -v npm >/dev/null 2>&1; then
    log_info "npm version: $(npm -v)"
fi

echo
echo "📁 === STEP 1: ENVIRONMENT VALIDATION ==="
log_info "Checking environment files..."

check_file "adminer/apps/api/.env.local" ".env.local"
check_file "adminer/apps/api/package.json" "API package.json"
check_file "adminer/package.json" "Root package.json"

echo
echo "🔑 === STEP 2: ENVIRONMENT VARIABLES ==="
log_info "Checking critical environment variables..."

# Load .env.local if it exists
if [[ -f "adminer/apps/api/.env.local" ]]; then
    log_info "Loading .env.local..."
    export $(grep -v '^#' adminer/apps/api/.env.local | xargs)
    
    # Check critical variables
    check_env_var "DATABASE_URL" "DATABASE_URL"
    check_env_var "DODO_WEBHOOK_SECRET" "DODO_WEBHOOK_SECRET"
    check_env_var "INNGEST_EVENT_KEY" "INNGEST_EVENT_KEY"
    check_env_var "INNGEST_SIGNING_KEY" "INNGEST_SIGNING_KEY"
    check_env_var "ALLOW_UNAUTH_DEV" "ALLOW_UNAUTH_DEV"
    check_env_var "BILLING_ENABLED" "BILLING_ENABLED"
else
    log_error ".env.local not found - cannot check environment variables"
    ((FAILED++))
fi

echo
echo "🗄️  === STEP 3: DATABASE CONNECTIVITY ==="
if [[ -n "${DATABASE_URL:-}" ]]; then
    log_info "Testing database connection..."
    if psql "$DATABASE_URL" -t -A -c "select 1 as ok;" >/dev/null 2>&1; then
        log_success "Database connection successful"
        ((PASSED++))
        
        log_info "Database info:"
        psql "$DATABASE_URL" -t -A -c "select 'Database:' as info, current_database() as db, current_user as user;" | head -2
    else
        log_error "Database connection failed"
        log_info "Common fixes:"
        log_info "  - Check DATABASE_URL format and credentials"
        log_info "  - Ensure database server is running"
        log_info "  - Check SSL requirements (Neon needs ?sslmode=require)"
        ((FAILED++))
    fi
else
    log_warning "DATABASE_URL not set - skipping database connectivity test"
    ((WARNINGS++))
fi

echo
echo "📊 === STEP 4: SCHEMA VALIDATION ==="
if [[ -n "${DATABASE_URL:-}" ]]; then
    log_info "Checking database schema..."
    
    # Check if required tables exist
    tables_output=$(psql "$DATABASE_URL" -t -A -c "\dt" 2>/dev/null || echo "")
    
    if echo "$tables_output" | grep -q "orgs"; then
        log_success "orgs table exists"
        ((PASSED++))
    else
        log_warning "orgs table not found - may need migration"
        ((WARNINGS++))
    fi
    
    if echo "$tables_output" | grep -q "webhook_events"; then
        log_success "webhook_events table exists"
        ((PASSED++))
    else
        log_warning "webhook_events table not found - may need migration"
        ((WARNINGS++))
    fi
    
    if echo "$tables_output" | grep -q "jobs"; then
        log_success "jobs table exists"
        ((PASSED++))
    else
        log_warning "jobs table not found - may need migration"
        ((WARNINGS++))
    fi
else
    log_warning "DATABASE_URL not set - skipping schema validation"
    ((WARNINGS++))
fi

echo
echo "📋 === STEP 5: MIGRATION SCRIPTS ==="
log_info "Checking migration scripts..."

check_file "adminer/apps/api/scripts/2025-08-22_add_current_period_end.sql" "Migration script"
check_file "adminer/scripts/smoke/sql/2025-08-22_smoke_seed.sql" "Smoke test seed script"
check_file "adminer/scripts/smoke/sql/2025-08-22_smoke_verify_before.sql" "Pre-verification script"
check_file "adminer/scripts/smoke/sql/2025-08-22_smoke_verify_after.sql" "Post-verification script"

echo
echo "📊 === PREFLIGHT CHECK SUMMARY ==="
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "⚠️  Warnings: $WARNINGS"

if [[ $FAILED -eq 0 ]]; then
    if [[ $WARNINGS -eq 0 ]]; then
        log_success "All checks passed! You're ready to run the smoke test."
        echo
        echo "🚀 Next step: Run the comprehensive smoke test:"
        echo "   bash adminer/scripts/smoke/adminer_smoke.sh"
    else
        log_warning "All critical checks passed, but there are some warnings."
        echo
        echo "⚠️  Review warnings above, then proceed with:"
        echo "   bash adminer/scripts/smoke/adminer_smoke.sh"
    fi
else
    log_error "Some checks failed. Please fix the issues above before proceeding."
    echo
    echo "🔧 Common fixes:"
    echo "  - Install missing tools: sudo apt install postgresql-client jq"
    echo "  - Create .env.local with required variables"
    echo "  - Check database connectivity and credentials"
    echo "  - Run database migrations if needed"
    exit 1
fi

echo
echo "⏰ Completed at: $(date)" 