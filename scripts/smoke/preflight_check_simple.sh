#!/bin/bash
set -euo pipefail

# Adminer Inngest Billing System - Simplified Preflight Check
# This script validates the environment before running tests

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

echo "🔧 === STEP 0: TOOLING CHECK ==="
log_info "Checking required tools..."

# Check PostgreSQL client
if command -v psql >/dev/null 2>&1; then
    log_success "PostgreSQL client (psql) is available"
else
    log_error "PostgreSQL client (psql) is not available"
    echo "  Install with: sudo apt install postgresql-client"
fi

# Check JSON processor
if command -v jq >/dev/null 2>&1; then
    log_success "JSON processor (jq) is available"
else
    log_error "JSON processor (jq) is not available"
    echo "  Install with: sudo apt install jq"
fi

# Check Node.js
if command -v node >/dev/null 2>&1; then
    log_success "Node.js is available"
    log_info "Node.js version: $(node -v)"
else
    log_error "Node.js is not available"
fi

# Check npm
if command -v npm >/dev/null 2>&1; then
    log_success "npm is available"
    log_info "npm version: $(npm -v)"
else
    log_error "npm is not available"
fi

echo
echo "📁 === STEP 1: ENVIRONMENT VALIDATION ==="
log_info "Checking environment files..."

# Check .env.local
if [[ -f "adminer/apps/api/.env.local" ]]; then
    log_success ".env.local exists"
else
    log_error ".env.local is missing"
    echo "  Create it with the required environment variables"
fi

# Check package.json files
if [[ -f "adminer/apps/api/package.json" ]]; then
    log_success "API package.json exists"
else
    log_error "API package.json is missing"
fi

if [[ -f "adminer/package.json" ]]; then
    log_success "Root package.json exists"
else
    log_error "Root package.json is missing"
fi

echo
echo "🔑 === STEP 2: ENVIRONMENT VARIABLES ==="
log_info "Checking critical environment variables..."

# Load .env.local if it exists
if [[ -f "adminer/apps/api/.env.local" ]]; then
    log_info "Loading .env.local..."
    export $(grep -v '^#' adminer/apps/api/.env.local | xargs)
    
    # Check critical variables
    if [[ -n "${DATABASE_URL:-}" ]]; then
        log_success "DATABASE_URL is set"
    else
        log_warning "DATABASE_URL is not set"
    fi
    
    if [[ -n "${DODO_WEBHOOK_SECRET:-}" ]]; then
        log_success "DODO_WEBHOOK_SECRET is set"
    else
        log_warning "DODO_WEBHOOK_SECRET is not set"
    fi
    
    if [[ -n "${INNGEST_EVENT_KEY:-}" ]]; then
        log_success "INNGEST_EVENT_KEY is set"
    else
        log_warning "INNGEST_EVENT_KEY is not set"
    fi
    
    if [[ -n "${INNGEST_SIGNING_KEY:-}" ]]; then
        log_success "INNGEST_SIGNING_KEY is set"
    else
        log_warning "INNGEST_SIGNING_KEY is not set"
    fi
    
    if [[ -n "${ALLOW_UNAUTH_DEV:-}" ]]; then
        log_success "ALLOW_UNAUTH_DEV is set"
    else
        log_warning "ALLOW_UNAUTH_DEV is not set"
    fi
    
    if [[ -n "${BILLING_ENABLED:-}" ]]; then
        log_success "BILLING_ENABLED is set"
    else
        log_warning "BILLING_ENABLED is not set"
    fi
else
    log_error ".env.local not found - cannot check environment variables"
fi

echo
echo "🗄️  === STEP 3: DATABASE CONNECTIVITY ==="
if [[ -n "${DATABASE_URL:-}" ]]; then
    log_info "Testing database connection..."
    if psql "$DATABASE_URL" -t -A -c "select 1 as ok;" >/dev/null 2>&1; then
        log_success "Database connection successful"
        
        log_info "Database info:"
        psql "$DATABASE_URL" -t -A -c "select 'Database:' as info, current_database() as db, current_user as user;" | head -2
    else
        log_error "Database connection failed"
        log_info "Common fixes:"
        log_info "  - Check DATABASE_URL format and credentials"
        log_info "  - Ensure database server is running"
        log_info "  - Check SSL requirements (Neon needs ?sslmode=require)"
    fi
else
    log_warning "DATABASE_URL not set - skipping database connectivity test"
fi

echo
echo "📊 === STEP 4: SCHEMA VALIDATION ==="
if [[ -n "${DATABASE_URL:-}" ]]; then
    log_info "Checking database schema..."
    
    # Check if required tables exist
    tables_output=$(psql "$DATABASE_URL" -t -A -c "\dt" 2>/dev/null || echo "")
    
    if echo "$tables_output" | grep -q "orgs"; then
        log_success "orgs table exists"
    else
        log_warning "orgs table not found - may need migration"
    fi
    
    if echo "$tables_output" | grep -q "webhook_events"; then
        log_success "webhook_events table exists"
    else
        log_warning "webhook_events table not found - may need migration"
    fi
    
    if echo "$tables_output" | grep -q "jobs"; then
        log_success "jobs table exists"
    else
        log_warning "jobs table not found - may need migration"
    fi
else
    log_warning "DATABASE_URL not set - skipping schema validation"
fi

echo
echo "📋 === STEP 5: MIGRATION SCRIPTS ==="
log_info "Checking migration scripts..."

# Check migration script
if [[ -f "adminer/apps/api/scripts/2025-08-22_add_current_period_end.sql" ]]; then
    log_success "Migration script exists"
else
    log_error "Migration script is missing"
fi

# Check smoke test scripts
if [[ -f "adminer/apps/api/scripts/smoke/sql/2025-08-22_smoke_seed.sql" ]]; then
    log_success "Smoke test seed script exists"
else
    log_error "Smoke test seed script is missing"
fi

if [[ -f "adminer/apps/api/scripts/smoke/sql/2025-08-22_smoke_verify_before.sql" ]]; then
    log_success "Pre-verification script exists"
else
    log_error "Pre-verification script is missing"
fi

if [[ -f "adminer/apps/api/scripts/smoke/sql/2025-08-22_smoke_verify_after.sql" ]]; then
    log_success "Post-verification script exists"
else
    log_error "Post-verification script is missing"
fi

echo
echo "🎉 === PREFLIGHT CHECK COMPLETED ==="
log_success "Preflight check completed!"
echo
echo "🚀 Next step: Run the comprehensive smoke test:"
echo "   bash adminer/scripts/smoke/adminer_smoke.sh"
echo
echo "⏰ Completed at: $(date)" 