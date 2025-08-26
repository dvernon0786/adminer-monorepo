#!/bin/bash

# 🔍 Vercel Environment Validation Script
# Comprehensive check of environment variable scoping and configuration

set -e

echo "🔍 Vercel Environment Validation"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in a Vercel environment
if [ -z "$VERCEL" ] && [ -z "$VERCEL_ENV" ]; then
    log_warning "Not running in Vercel environment"
    log_info "This script is designed for Vercel deployments"
    log_info "Run locally to check environment variable templates"
fi

echo "📋 Environment Information:"
echo "   VERCEL: ${VERCEL:-'false'}"
echo "   VERCEL_ENV: ${VERCEL_ENV:-'local'}"
echo "   NODE_ENV: ${NODE_ENV:-'not set'}"
echo ""

# Required environment variables by scope
declare -A REQUIRED_VARS

# Production scope
REQUIRED_VARS["production"]="
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DODO_API_KEY
DODO_WEBHOOK_SECRET
DODO_FREE_PRODUCT_ID
DODO_PRO_PRODUCT_ID
DODO_ENT_PRODUCT_ID
DATABASE_URL
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
"

# Preview scope
REQUIRED_VARS["preview"]="
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DODO_API_KEY
DODO_WEBHOOK_SECRET
DODO_FREE_PRODUCT_ID
DODO_PRO_PRODUCT_ID
DODO_ENT_PRODUCT_ID
DATABASE_URL
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
"

# Development scope
REQUIRED_VARS["development"]="
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DODO_API_KEY
DODO_WEBHOOK_SECRET
DODO_FREE_PRODUCT_ID
DODO_PRO_PRODUCT_ID
DODO_ENT_PRODUCT_ID
DATABASE_URL
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
"

# Optional but recommended variables
OPTIONAL_VARS="
INTERNAL_ENDPOINTS_ENABLED
INTERNAL_TOKEN
BILLING_AUTODOWNGRADE_ENABLED
BILLING_ENABLED
MAX_KEYS_SHOWN
LOG_LEVEL
"

# Current environment
CURRENT_ENV="${VERCEL_ENV:-development}"

echo "🎯 Validating Environment: $CURRENT_ENV"
echo ""

# Check required variables for current environment
log_info "Checking required environment variables..."

MISSING_VARS=()
REQUIRED_LIST="${REQUIRED_VARS[$CURRENT_ENV]}"

for var in $REQUIRED_LIST; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
        log_error "Missing: $var"
    else
        log_success "Set: $var"
    fi
done

echo ""

# Check optional variables
log_info "Checking optional environment variables..."

for var in $OPTIONAL_VARS; do
    if [ -z "${!var}" ]; then
        log_warning "Not set: $var (optional)"
    else
        log_success "Set: $var = ${!var}"
    fi
done

echo ""

# Environment-specific recommendations
log_info "Environment-specific recommendations:"

case $CURRENT_ENV in
    "production")
        if [ "$INTERNAL_ENDPOINTS_ENABLED" = "true" ]; then
            log_warning "INTERNAL_ENDPOINTS_ENABLED=true in production (security risk)"
            log_info "Recommend: Set to false or undefined in production"
        else
            log_success "Internal endpoints disabled in production (secure)"
        fi
        
        if [ "$BILLING_AUTODOWNGRADE_ENABLED" = "true" ]; then
            log_success "Automated billing enabled in production"
        else
            log_warning "Automated billing disabled in production"
        fi
        ;;
        
    "preview")
        if [ -z "$INTERNAL_TOKEN" ]; then
            log_warning "INTERNAL_TOKEN not set for preview environment"
            log_info "Recommend: Set for secure internal endpoint access"
        else
            log_success "Internal token configured for preview"
        fi
        
        if [ "$INTERNAL_ENDPOINTS_ENABLED" = "true" ]; then
            log_success "Internal endpoints enabled in preview"
        else
            log_warning "Internal endpoints disabled in preview"
        fi
        ;;
        
    "development")
        log_info "Development environment - all features enabled"
        if [ "$ALLOW_UNAUTH_DEV" = "true" ]; then
            log_warning "ALLOW_UNAUTH_DEV=true (development only)"
        fi
        ;;
esac

echo ""

# Security checks
log_info "Security validation..."

# Check for hardcoded secrets
if echo "$CLERK_PUBLISHABLE_KEY" | grep -q "pk_test_"; then
    log_warning "Using test Clerk key in $CURRENT_ENV environment"
fi

if echo "$DODO_API_KEY" | grep -q "test"; then
    log_warning "Using test Dodo key in $CURRENT_ENV environment"
fi

# Check database URL security
if [ -n "$DATABASE_URL" ]; then
    if echo "$DATABASE_URL" | grep -q "localhost\|127.0.0.1"; then
        log_error "DATABASE_URL contains localhost (security risk)"
    else
        log_success "DATABASE_URL appears to be remote (secure)"
    fi
fi

echo ""

# Configuration recommendations
log_info "Configuration recommendations:"

# Node.js version check
if [ -n "$NODE_VERSION" ]; then
    if [[ "$NODE_VERSION" == 20.* ]]; then
        log_success "Node.js version: $NODE_VERSION (recommended)"
    else
        log_warning "Node.js version: $NODE_VERSION (recommend 20.x)"
    fi
else
    log_warning "NODE_VERSION not set (check Vercel project settings)"
fi

# Build settings
if [ -n "$VERCEL_PROJECT_ID" ]; then
    log_success "Vercel project configured: $VERCEL_PROJECT_ID"
else
    log_warning "VERCEL_PROJECT_ID not set"
fi

echo ""

# Summary
echo "📊 Validation Summary:"
echo "======================"

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    log_success "✅ All required environment variables are set"
    echo ""
    log_success "🎉 Environment validation PASSED!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Deploy to verify all systems work"
    echo "   2. Run micro-smoke test: npm run micro:smoke"
    echo "   3. Run full smoke test: npm run smoke"
    exit 0
else
    log_error "❌ Missing ${#MISSING_VARS[@]} required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    log_error "💥 Environment validation FAILED!"
    echo ""
    echo "🚨 Immediate actions:"
    echo "   1. Set missing environment variables in Vercel"
    echo "   2. Verify variable scoping (Production vs Preview)"
    echo "   3. Check Vercel project settings"
    echo "   4. Re-run validation after fixing"
    exit 1
fi 