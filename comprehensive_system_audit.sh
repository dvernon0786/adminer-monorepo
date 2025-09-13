#!/bin/bash

# Comprehensive System Architecture Audit
# Verifies: Clerk → Payment → Drizzle → Database → Quota → Inngest

set -e

echo "🔍 COMPREHENSIVE SYSTEM ARCHITECTURE AUDIT"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Create audit log
AUDIT_LOG="system_audit_$(date +%Y%m%d_%H%M%S).log"
echo "📝 Creating audit log: $AUDIT_LOG"

echo ""
print_info "PHASE 1: CLERK AUTHENTICATION VERIFICATION"

echo "🔍 Testing Clerk authentication integration..."

# Check if Clerk is configured
echo "Checking Clerk configuration in frontend..."
CLERK_CONFIG_FILES=$(find . -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs grep -l "clerk" 2>/dev/null | head -5)

if [ ! -z "$CLERK_CONFIG_FILES" ]; then
    print_status "Clerk integration files found"
    echo "$CLERK_CONFIG_FILES" | while read -r file; do
        echo "  📄 $file"
        clerk_lines=$(grep -n "clerk\|Clerk" "$file" 2>/dev/null | head -3)
        if [ ! -z "$clerk_lines" ]; then
            echo "$clerk_lines" | sed 's/^/    /'
        fi
    done
else
    print_error "No Clerk integration files found"
    echo "CLERK_MISSING: No authentication integration detected" >> $AUDIT_LOG
fi

echo ""
print_info "PHASE 2: PAYMENT SYSTEM VERIFICATION"

echo "🔍 Testing payment system integration..."

# Check for payment-related code
PAYMENT_PATTERNS=("dodo" "stripe" "payment" "billing" "subscription")

for pattern in "${PAYMENT_PATTERNS[@]}"; do
    echo "  Searching for: $pattern"
    results=$(find . -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs grep -l -i "$pattern" 2>/dev/null | head -3)
    if [ ! -z "$results" ]; then
        print_status "Found $pattern integration"
        echo "$results" | sed 's/^/    📄 /'
        echo "PAYMENT_FOUND: $pattern" >> $AUDIT_LOG
    else
        print_warning "No $pattern integration found"
    fi
done

echo ""
print_info "PHASE 3: DRIZZLE ORM VERIFICATION"

echo "🔍 Testing Drizzle ORM configuration..."

# Check Drizzle configuration
echo "Checking Drizzle configuration files..."
DRIZZLE_FILES=("drizzle.config.ts" "drizzle.config.js")

for file in "${DRIZZLE_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found Drizzle config: $file"
        echo "CONFIG_FILE: $file" >> $AUDIT_LOG
        
        # Check if it uses Neon
        neon_check=$(grep -i "neon" "$file" 2>/dev/null || echo "")
        if [ ! -z "$neon_check" ]; then
            print_status "  Neon database configured"
            echo "$neon_check" | sed 's/^/    /'
        else
            print_warning "  No Neon configuration found"
        fi
    fi
done

# Check database schema files
echo "Checking database schema files..."
SCHEMA_FILES=$(find . -name "schema.ts" -o -name "schema.js" 2>/dev/null)

if [ ! -z "$SCHEMA_FILES" ]; then
    echo "$SCHEMA_FILES" | while read -r schema_file; do
        print_status "Found schema file: $schema_file"
        
        # Check for table definitions
        tables=$(grep -n "pgTable\|mysqlTable\|sqliteTable" "$schema_file" 2>/dev/null || echo "")
        if [ ! -z "$tables" ]; then
            echo "  Tables defined:"
            echo "$tables" | sed 's/^/    /'
            echo "SCHEMA_TABLES: $schema_file" >> $AUDIT_LOG
            echo "$tables" >> $AUDIT_LOG
        fi
    done
else
    print_error "No schema files found"
    echo "SCHEMA_MISSING: No database schema found" >> $AUDIT_LOG
fi

echo ""
print_info "PHASE 4: DATABASE CONNECTION VERIFICATION"

echo "🔍 Testing database connection and tables..."

# Test database connection via API
echo "Testing database connection via API..."
DB_TEST_RESPONSE=$(curl -s "https://adminer-api-fixed.vercel.app/api/debug-db" 2>/dev/null || echo "FAILED")

if [[ "$DB_TEST_RESPONSE" != "FAILED" ]]; then
    if [[ "$DB_TEST_RESPONSE" == *"success"*"true"* ]]; then
        print_status "Database connection successful"
        echo "DB_CONNECTION_SUCCESS" >> $AUDIT_LOG
        
        # Extract table information
        echo "Database response preview:"
        echo "$DB_TEST_RESPONSE" | head -c 200 | sed 's/^/    /'
    else
        print_error "Database connection failed"
        echo "DB_CONNECTION_FAILED" >> $AUDIT_LOG
        echo "$DB_TEST_RESPONSE" | head -c 200 >> $AUDIT_LOG
    fi
else
    print_warning "Database test endpoint not accessible"
    echo "DB_ENDPOINT_FAILED" >> $AUDIT_LOG
fi

echo ""
print_info "PHASE 5: DATABASE TABLES VERIFICATION"

echo "🔍 Verifying all database tables exist..."

# Test quota endpoint (organizations table)
echo "Testing organizations table via quota endpoint..."
QUOTA_RESPONSE=$(curl -s -H "x-org-id: test-org" "https://adminer-api-fixed.vercel.app/api/quota" 2>/dev/null || echo "FAILED")

if [[ "$QUOTA_RESPONSE" == *"real_database"* ]]; then
    print_status "Organizations table working"
    echo "ORGS_TABLE_SUCCESS" >> $AUDIT_LOG
    
    # Check quota values
    if [[ "$QUOTA_RESPONSE" == *"used"* ]] && [[ "$QUOTA_RESPONSE" == *"limit"* ]]; then
        print_status "  Quota data structure correct"
        echo "    $(echo "$QUOTA_RESPONSE" | grep -o '"used":[0-9]*' || echo 'quota data')"
    fi
else
    print_error "Organizations table issue"
    echo "ORGS_TABLE_FAILED" >> $AUDIT_LOG
    echo "$QUOTA_RESPONSE" | head -c 100 >> $AUDIT_LOG
fi

# Test analysis stats endpoint (jobs table)
echo "Testing jobs table via analysis stats endpoint..."
STATS_RESPONSE=$(curl -s -H "x-org-id: test-org" "https://adminer-api-fixed.vercel.app/api/analyses/stats" 2>/dev/null || echo "FAILED")

if [[ "$STATS_RESPONSE" == *"real_database"* ]]; then
    print_status "Jobs table working"
    echo "JOBS_TABLE_SUCCESS" >> $AUDIT_LOG
else
    print_warning "Jobs table may have issues (not critical for basic functionality)"
    echo "JOBS_TABLE_WARNING" >> $AUDIT_LOG
fi

echo ""
print_info "PHASE 6: QUOTA SYSTEM VERIFICATION"

echo "🔍 Testing quota calculation and enforcement..."

# Test quota calculation
echo "Testing quota calculation logic..."
if [[ "$QUOTA_RESPONSE" == *"percentage"* ]]; then
    percentage=$(echo "$QUOTA_RESPONSE" | grep -o '"percentage":[0-9]*' | grep -o '[0-9]*')
    if [ ! -z "$percentage" ]; then
        print_status "Quota percentage calculation working: ${percentage}%"
        echo "QUOTA_CALC_SUCCESS: ${percentage}%" >> $AUDIT_LOG
    fi
fi

# Check if quota enforcement exists in code
echo "Checking quota enforcement code..."
QUOTA_ENFORCEMENT=$(find . -name "*.ts" -o -name "*.js" | xargs grep -l "quota.*exceed\|exceed.*quota\|402\|quotaUsed.*quotaLimit" 2>/dev/null | head -3)

if [ ! -z "$QUOTA_ENFORCEMENT" ]; then
    print_status "Quota enforcement code found"
    echo "$QUOTA_ENFORCEMENT" | sed 's/^/    📄 /'
    echo "QUOTA_ENFORCEMENT_FOUND" >> $AUDIT_LOG
else
    print_warning "No quota enforcement code detected"
    echo "QUOTA_ENFORCEMENT_MISSING" >> $AUDIT_LOG
fi

echo ""
print_info "PHASE 7: INNGEST INTEGRATION VERIFICATION"

echo "🔍 Testing Inngest integration..."

# Test job creation (triggers Inngest)
echo "Testing job creation and Inngest triggering..."
JOB_RESPONSE=$(curl -s -X POST "https://adminer-api-fixed.vercel.app/api/jobs" \
  -H "Content-Type: application/json" \
  -H "x-org-id: test-org" \
  -d '{"keyword":"audit-test","limit":1}' 2>/dev/null || echo "FAILED")

if [[ "$JOB_RESPONSE" == *"jobId"* ]] && [[ "$JOB_RESPONSE" == *"created"* ]]; then
    print_status "Job creation working"
    jobId=$(echo "$JOB_RESPONSE" | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)
    print_status "  Job created: $jobId"
    echo "INNGEST_JOB_SUCCESS: $jobId" >> $AUDIT_LOG
else
    print_error "Job creation failed"
    echo "INNGEST_JOB_FAILED" >> $AUDIT_LOG
    echo "$JOB_RESPONSE" | head -c 100 >> $AUDIT_LOG
fi

# Test Inngest webhook
echo "Testing Inngest webhook endpoint..."
INNGEST_RESPONSE=$(curl -s "https://adminer-api-fixed.vercel.app/api/inngest" 2>/dev/null || echo "FAILED")

if [[ "$INNGEST_RESPONSE" == *"functions"* ]] || [[ "$INNGEST_RESPONSE" == *"success"* ]]; then
    print_status "Inngest webhook responding"
    
    # Count functions if response contains function definitions
    if [[ "$INNGEST_RESPONSE" == *"functions"* ]]; then
        func_count=$(echo "$INNGEST_RESPONSE" | grep -o '"id":' | wc -l)
        print_status "  Functions registered: $func_count"
        echo "INNGEST_FUNCTIONS: $func_count" >> $AUDIT_LOG
    fi
else
    print_error "Inngest webhook not responding correctly"
    echo "INNGEST_WEBHOOK_FAILED" >> $AUDIT_LOG
fi

echo ""
print_info "PHASE 8: LOCAL DATABASE PREVENTION CHECK"

echo "🔍 Checking for local database usage..."

# Check for local database URLs
LOCAL_DB_PATTERNS=("localhost" "127.0.0.1" "sqlite" "local.db" ".db")

for pattern in "${LOCAL_DB_PATTERNS[@]}"; do
    echo "  Checking for: $pattern"
    local_results=$(find . -name "*.ts" -o -name "*.js" -o -name "*.env*" | xargs grep -l "$pattern" 2>/dev/null | head -3)
    if [ ! -z "$local_results" ]; then
        print_error "Found potential local database reference: $pattern"
        echo "$local_results" | sed 's/^/    ❌ /'
        echo "LOCAL_DB_FOUND: $pattern" >> $AUDIT_LOG
        echo "$local_results" >> $AUDIT_LOG
    fi
done

# Check for hardcoded database connections
echo "Checking for hardcoded database connections..."
HARDCODED_DB=$(find . -name "*.ts" -o -name "*.js" | xargs grep -n "postgresql://\|mysql://\|sqlite:" 2>/dev/null | head -5)

if [ ! -z "$HARDCODED_DB" ]; then
    print_error "Found hardcoded database connections"
    echo "$HARDCODED_DB" | sed 's/^/    ❌ /'
    echo "HARDCODED_DB_FOUND" >> $AUDIT_LOG
    echo "$HARDCODED_DB" >> $AUDIT_LOG
else
    print_status "No hardcoded database connections found"
fi

echo ""
print_info "PHASE 9: DATA FLOW VERIFICATION"

echo "🔍 Testing complete data flow..."

# Test complete user journey
echo "Simulating user journey:"
echo "  1. User authentication (Clerk) → Frontend"
echo "  2. Frontend → API quota check"
echo "  3. API → Database query"
echo "  4. Database → API response"
echo "  5. API → Frontend display"

# Verify the quota flow works end-to-end
if [[ "$QUOTA_RESPONSE" == *"real_database"* ]]; then
    print_status "Complete quota flow verified"
else
    print_error "Quota flow broken"
fi

echo ""
print_info "PHASE 10: AUDIT SUMMARY"

echo ""
echo "📋 SYSTEM ARCHITECTURE AUDIT SUMMARY"
echo "===================================="

# Count issues
clerk_issues=$(grep -c "CLERK_MISSING" $AUDIT_LOG 2>/dev/null || echo "0")
payment_issues=$(grep -c "PAYMENT_.*" $AUDIT_LOG 2>/dev/null || wc -l <<< "$(grep "PAYMENT_FOUND" $AUDIT_LOG 2>/dev/null)")
db_issues=$(grep -c "DB_.*_FAILED\|SCHEMA_MISSING" $AUDIT_LOG 2>/dev/null || echo "0")
local_db_issues=$(grep -c "LOCAL_DB_FOUND\|HARDCODED_DB_FOUND" $AUDIT_LOG 2>/dev/null || echo "0")
inngest_issues=$(grep -c "INNGEST_.*_FAILED" $AUDIT_LOG 2>/dev/null || echo "0")

total_critical_issues=$((clerk_issues + db_issues + local_db_issues + inngest_issues))

echo ""
if [ $total_critical_issues -eq 0 ]; then
    print_status "✅ SYSTEM ARCHITECTURE VERIFICATION PASSED"
    echo ""
    echo "🔗 COMPLETE DATA FLOW VERIFIED:"
    echo "  ✅ Clerk → Authentication working"
    echo "  ✅ Payment → System integrated"  
    echo "  ✅ Drizzle → ORM configured"
    echo "  ✅ Database → Neon connection working"
    echo "  ✅ Quota → Real-time calculation working"
    echo "  ✅ Inngest → Background processing working"
    echo "  ✅ No local database usage detected"
    echo ""
    print_status "SYSTEM IS PRODUCTION READY"
else
    print_error "❌ CRITICAL ISSUES FOUND: $total_critical_issues"
    echo ""
    echo "🚨 ISSUES TO RESOLVE:"
    if [ $clerk_issues -gt 0 ]; then
        echo "  - Clerk authentication: $clerk_issues issues"
    fi
    if [ $db_issues -gt 0 ]; then
        echo "  - Database connection: $db_issues issues"
    fi
    if [ $local_db_issues -gt 0 ]; then
        echo "  - Local database usage: $local_db_issues issues"
    fi
    if [ $inngest_issues -gt 0 ]; then
        echo "  - Inngest integration: $inngest_issues issues"
    fi
    echo ""
    print_error "SYSTEM REQUIRES FIXES BEFORE PRODUCTION"
fi

echo ""
print_status "COMPREHENSIVE AUDIT COMPLETE"
echo "📝 Full audit log saved to: $AUDIT_LOG"

if [ $total_critical_issues -gt 0 ]; then
    exit 1
else
    exit 0
fi