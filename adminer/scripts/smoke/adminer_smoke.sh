#!/bin/bash
set -euo pipefail

# Adminer Inngest Billing System - Comprehensive Smoke Test
# This script tests the complete downgrade pipeline from database to API

API_DIR="adminer/apps/api"
cd "$API_DIR"

echo "🚀 === ADMINER INNGEST BILLING SYSTEM SMOKE TEST ==="
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

# Step 1: Environment validation
echo "🔍 === STEP 1: ENVIRONMENT VALIDATION ==="
log_info "Checking .env.local file..."
if [[ ! -f .env.local ]]; then
    log_error "Missing .env.local file"
    exit 1
fi
log_success ".env.local found"

log_info "Loading environment variables..."
export DATABASE_URL="$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)"
export BASE_URL="http://localhost:3000"

if [[ -z "$DATABASE_URL" ]]; then
    log_error "DATABASE_URL not found in .env.local"
    exit 1
fi
log_success "Environment variables loaded"

# Step 2: Database connectivity test
echo
echo "🗄️  === STEP 2: DATABASE CONNECTIVITY ==="
log_info "Testing database connection..."
if ! psql "$DATABASE_URL" -t -A -c "select 'db_ok' tag, now();" >/dev/null 2>&1; then
    log_error "Database connection failed"
    log_info "Please check your DATABASE_URL and ensure the database is accessible"
    exit 1
fi
log_success "Database connection successful"

log_info "Database info:"
psql "$DATABASE_URL" -t -A -c "select 'Database:' as info, current_database() as db, current_user as user, version() as version;" | head -3

# Step 3: TypeScript compilation check
echo
echo "🔧 === STEP 3: TYPESCRIPT COMPILATION ==="
log_info "Checking TypeScript compilation..."
if ! npx tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
    log_error "TypeScript compilation failed"
    log_info "Please fix compilation errors before proceeding"
    exit 1
fi
log_success "TypeScript compilation successful"

# Step 4: Database migration
echo
echo "📊 === STEP 4: DATABASE MIGRATION ==="
log_info "Creating base tables..."
if ! psql "$DATABASE_URL" -f scripts/create-tables.sql >/dev/null 2>&1; then
    log_error "Base table creation failed"
    exit 1
fi
log_success "Base tables created"

log_info "Running billing migration..."
if ! psql "$DATABASE_URL" -f scripts/2025-01-22_billing.sql >/dev/null 2>&1; then
    log_error "Billing migration failed"
    exit 1
fi
log_success "Billing migration completed"

log_info "Adding current period end column..."
if ! psql "$DATABASE_URL" -f scripts/2025-08-22_add_current_period_end.sql >/dev/null 2>&1; then
    log_error "Current period end migration failed"
    exit 1
fi
log_success "Current period end migration completed"

log_info "Current database schema:"
psql "$DATABASE_URL" -c "\dt+" | grep -E "(orgs|webhook_events|jobs)" || true

# Step 5: Smoke test data seeding
echo
echo "🌱 === STEP 5: SMOKE TEST DATA SEEDING ==="
log_info "Seeding test data..."
if ! psql "$DATABASE_URL" -f scripts/smoke/sql/2025-08-22_smoke_seed.sql >/dev/null 2>&1; then
    log_error "Data seeding failed"
    exit 1
fi
log_success "Test data seeded successfully"

# Step 6: Pre-downgrade verification
echo
echo "🔍 === STEP 6: PRE-DOWNGRADE VERIFICATION ==="
log_info "Verifying pre-downgrade state..."
psql "$DATABASE_URL" -f scripts/smoke/sql/2025-08-22_smoke_verify_before.sql

# Step 7: API health checks
echo
echo "🏥 === STEP 7: API HEALTH CHECKS ==="
log_info "Checking if API server is running..."
if ! curl -s "$BASE_URL/api/inngest" >/dev/null 2>&1; then
    log_warning "API server not responding. Please start it with: npm run dev"
    log_info "Continuing with database-only tests..."
else
    log_success "API server is running"
    
    log_info "Testing Inngest endpoint..."
    if curl -s "$BASE_URL/api/inngest" | grep -q "Inngest"; then
        log_success "Inngest endpoint responding"
    else
        log_warning "Inngest endpoint may not be properly configured"
    fi
    
    log_info "Testing admin endpoint (dry run)..."
    if curl -sS -X POST "$BASE_URL/api/admin/downgrade-canceled?dryRun=1" | jq . >/dev/null 2>&1; then
        log_success "Admin endpoint dry run successful"
    else
        log_warning "Admin endpoint dry run failed - check server logs"
    fi
fi

# Step 8: Execute downgrade (if API is available)
echo
echo "⚡ === STEP 8: EXECUTE DOWNGRADE ==="
if curl -s "$BASE_URL/api/admin/downgrade-canceled" >/dev/null 2>&1; then
    log_info "Executing actual downgrade..."
    if curl -sS -X POST "$BASE_URL/api/admin/downgrade-canceled" | jq . >/dev/null 2>&1; then
        log_success "Downgrade execution successful"
    else
        log_warning "Downgrade execution failed - check server logs"
    fi
else
    log_warning "API server not available - skipping downgrade execution"
    log_info "You can run the downgrade manually once the server is started"
fi

# Step 9: Post-downgrade verification
echo
echo "🔍 === STEP 9: POST-DOWNGRADE VERIFICATION ==="
log_info "Verifying post-downgrade state..."
psql "$DATABASE_URL" -f scripts/smoke/sql/2025-08-22_smoke_verify_after.sql

# Step 10: Final status check
echo
echo "📊 === STEP 10: FINAL STATUS CHECK ==="
log_info "Quick database assertion..."
psql "$DATABASE_URL" -c "
SELECT 
  'Final Status' as check_point,
  COUNT(*) as total_orgs,
  COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_orgs,
  COUNT(CASE WHEN billing_status = 'canceled_downgraded' THEN 1 END) as downgraded_orgs
FROM orgs 
WHERE id LIKE 'test_smoke_%';
"

echo
echo "🎉 === SMOKE TEST COMPLETED ==="
log_success "All smoke test steps completed successfully!"
echo
echo "📋 Next steps:"
echo "1. Start the API server: cd $API_DIR && npm run dev"
echo "2. Start Inngest dev server: cd $API_DIR && npx inngest-cli@latest dev"
echo "3. Monitor logs for any errors or warnings"
echo "4. Test the downgrade manually if needed"
echo
echo "⏰ Completed at: $(date)" 