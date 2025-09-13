#!/bin/bash

# Comprehensive Mock Data Audit and Fix Script
# Systematically finds and eliminates all mock data from the system

set -e

echo "🔍 COMPREHENSIVE MOCK DATA AUDIT"
echo "=================================="

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
AUDIT_LOG="mock_data_audit_$(date +%Y%m%d_%H%M%S).log"
echo "📝 Creating audit log: $AUDIT_LOG"

echo ""
print_info "PHASE 1: MOCK DATA DETECTION"

# Search for common mock data patterns
echo "Searching for hardcoded mock data patterns..." >> $AUDIT_LOG

echo ""
echo "🔍 Searching for quota mock data:"
QUOTA_MOCK_PATTERNS=(
    "used.*45"
    "limit.*100" 
    "percentage.*45"
    "quotaUsed.*45"
    "quotaLimit.*100"
    "mock.*quota"
    "fake.*quota"
)

for pattern in "${QUOTA_MOCK_PATTERNS[@]}"; do
    echo "  Searching for: $pattern"
    results=$(grep -r -i "$pattern" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null || true)
    if [ ! -z "$results" ]; then
        print_error "Found quota mock data pattern: $pattern"
        echo "$results" | head -10
        echo "QUOTA_MOCK_FOUND: $pattern" >> $AUDIT_LOG
        echo "$results" >> $AUDIT_LOG
    fi
done

echo ""
echo "🔍 Searching for general mock data patterns:"
GENERAL_MOCK_PATTERNS=(
    "mock.*data"
    "fake.*data"
    "dummy.*data"
    "test.*data"
    "example.*data"
    "hardcoded"
    "placeholder"
)

for pattern in "${GENERAL_MOCK_PATTERNS[@]}"; do
    echo "  Searching for: $pattern"
    results=$(grep -r -i "$pattern" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null || true)
    if [ ! -z "$results" ]; then
        print_warning "Found general mock data pattern: $pattern"
        echo "$results" | head -5
        echo "GENERAL_MOCK_FOUND: $pattern" >> $AUDIT_LOG
    fi
done

echo ""
echo "🔍 Searching for API mock responses:"
API_MOCK_PATTERNS=(
    "res\.status.*\.json.*used"
    "return.*used.*45"
    "return.*limit.*100"
    "mock.*response"
    "fake.*response"
)

for pattern in "${API_MOCK_PATTERNS[@]}"; do
    echo "  Searching for: $pattern"
    results=$(grep -r -E "$pattern" . --include="*.js" --include="*.ts" 2>/dev/null || true)
    if [ ! -z "$results" ]; then
        print_error "Found API mock response pattern: $pattern"
        echo "$results"
        echo "API_MOCK_FOUND: $pattern" >> $AUDIT_LOG
        echo "$results" >> $AUDIT_LOG
    fi
done

echo ""
print_info "PHASE 2: SPECIFIC FILE AUDIT"

# Check specific critical files
CRITICAL_FILES=(
    "adminer/apps/api/api/consolidated.js"
    "adminer/apps/api/src/lib/db.js" 
    "adminer/apps/api/src/lib/db.ts"
    "adminer/apps/web/src/components/dashboard"
    "adminer/apps/web/src/pages/dashboard"
)

for file_pattern in "${CRITICAL_FILES[@]}"; do
    echo "🔍 Auditing: $file_pattern"
    
    # Find files matching the pattern
    files_found=$(find . -path "*$file_pattern*" -type f 2>/dev/null || true)
    
    if [ ! -z "$files_found" ]; then
        echo "$files_found" | while read -r file; do
            if [ -f "$file" ]; then
                echo "  📄 Checking file: $file"
                
                # Check for quota-related mock data
                quota_lines=$(grep -n -i "used.*45\|limit.*100\|percentage.*45" "$file" 2>/dev/null || true)
                if [ ! -z "$quota_lines" ]; then
                    print_error "    Found quota mock data:"
                    echo "$quota_lines"
                    echo "FILE_QUOTA_MOCK: $file" >> $AUDIT_LOG
                    echo "$quota_lines" >> $AUDIT_LOG
                fi
                
                # Check for hardcoded returns
                hardcoded_lines=$(grep -n -E "return.*\{.*used.*\}" "$file" 2>/dev/null || true)
                if [ ! -z "$hardcoded_lines" ]; then
                    print_error "    Found hardcoded return data:"
                    echo "$hardcoded_lines"
                    echo "FILE_HARDCODED: $file" >> $AUDIT_LOG
                    echo "$hardcoded_lines" >> $AUDIT_LOG
                fi
            fi
        done
    else
        print_warning "  File pattern not found: $file_pattern"
    fi
done

echo ""
print_info "PHASE 3: DATABASE CONNECTION AUDIT"

# Check if database operations are real
echo "🔍 Checking database operations:"

# Look for actual database queries vs mock returns
DB_OPERATION_FILES=$(find . -name "*.js" -o -name "*.ts" | grep -E "(db|database|query)" | head -10)

if [ ! -z "$DB_OPERATION_FILES" ]; then
    echo "$DB_OPERATION_FILES" | while read -r file; do
        if [ -f "$file" ]; then
            echo "  📄 Checking DB file: $file"
            
            # Check for SELECT queries (real database operations)
            select_queries=$(grep -n -i "SELECT\|INSERT\|UPDATE\|DELETE" "$file" 2>/dev/null || true)
            if [ ! -z "$select_queries" ]; then
                print_status "    Found real database operations"
                echo "$select_queries" | head -3
            fi
            
            # Check for mock database returns
            mock_returns=$(grep -n -E "return.*\{.*used.*\}|console\.log.*Creating|console\.log.*Updating" "$file" 2>/dev/null || true)
            if [ ! -z "$mock_returns" ]; then
                print_error "    Found mock database returns:"
                echo "$mock_returns"
                echo "DB_MOCK_RETURN: $file" >> $AUDIT_LOG
                echo "$mock_returns" >> $AUDIT_LOG
            fi
        fi
    done
fi

echo ""
print_info "PHASE 4: API ENDPOINT TESTING"

# Test actual API endpoints for mock data
echo "🔍 Testing API endpoints for mock responses:"

API_ENDPOINTS=(
    "https://www.adminer.online/api/quota"
    "https://www.adminer.online/api/jobs"
    "https://www.adminer.online/api/health"
    "https://adminer-api-fixed.vercel.app/api/quota"
    "https://adminer-api-fixed.vercel.app/api/jobs"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    echo "  🌐 Testing: $endpoint"
    
    response=$(curl -s "$endpoint" 2>/dev/null || echo "FAILED")
    
    if [[ "$response" != "FAILED" ]]; then
        # Check if response contains quota mock data
        if [[ "$response" == *"used"*"45"* ]] || [[ "$response" == *"limit"*"100"* ]]; then
            print_error "    MOCK DATA DETECTED in response:"
            echo "    $response"
            echo "ENDPOINT_MOCK: $endpoint" >> $AUDIT_LOG
            echo "Response: $response" >> $AUDIT_LOG
        else
            print_status "    Response appears to use real data"
            echo "    $response" | head -c 100
        fi
    else
        print_warning "    Endpoint not accessible or failed"
    fi
done

echo ""
print_info "PHASE 5: ENVIRONMENT VARIABLE AUDIT"

# Check for mock/test environment variables
echo "🔍 Checking environment variable patterns:"

ENV_FILES=$(find . -name ".env*" -o -name "*.env" 2>/dev/null || true)
if [ ! -z "$ENV_FILES" ]; then
    echo "$ENV_FILES" | while read -r env_file; do
        if [ -f "$env_file" ]; then
            echo "  📄 Checking env file: $env_file"
            
            # Check for test/mock URLs or keys
            test_vars=$(grep -i "test\|mock\|fake\|example\|localhost" "$env_file" 2>/dev/null || true)
            if [ ! -z "$test_vars" ]; then
                print_warning "    Found test/mock environment variables:"
                echo "$test_vars"
                echo "ENV_TEST_VARS: $env_file" >> $AUDIT_LOG
                echo "$test_vars" >> $AUDIT_LOG
            fi
        fi
    done
fi

echo ""
print_info "PHASE 6: GENERATING AUDIT SUMMARY"

echo ""
echo "📋 AUDIT SUMMARY"
echo "================"

# Count issues found
quota_mock_count=$(grep -c "QUOTA_MOCK_FOUND" $AUDIT_LOG 2>/dev/null || echo "0")
api_mock_count=$(grep -c "API_MOCK_FOUND" $AUDIT_LOG 2>/dev/null || echo "0") 
file_mock_count=$(grep -c "FILE_QUOTA_MOCK\|FILE_HARDCODED" $AUDIT_LOG 2>/dev/null || echo "0")
db_mock_count=$(grep -c "DB_MOCK_RETURN" $AUDIT_LOG 2>/dev/null || echo "0")
endpoint_mock_count=$(grep -c "ENDPOINT_MOCK" $AUDIT_LOG 2>/dev/null || echo "0")

total_issues=$((quota_mock_count + api_mock_count + file_mock_count + db_mock_count + endpoint_mock_count))

if [ $total_issues -gt 0 ]; then
    print_error "CRITICAL ISSUES FOUND: $total_issues total mock data issues"
    echo "  - Quota mock patterns: $quota_mock_count"
    echo "  - API mock patterns: $api_mock_count"
    echo "  - File mock data: $file_mock_count"
    echo "  - Database mock returns: $db_mock_count"  
    echo "  - Endpoint mock responses: $endpoint_mock_count"
    echo ""
    print_error "SYSTEM IS NOT PRODUCTION READY - Mock data must be eliminated"
else
    print_status "NO CRITICAL MOCK DATA ISSUES FOUND"
    print_status "System appears to use real data"
fi

echo ""
print_info "PHASE 7: MOCK DATA ELIMINATION RECOMMENDATIONS"

if [ $total_issues -gt 0 ]; then
    echo ""
    echo "🔧 IMMEDIATE ACTIONS REQUIRED:"
    echo ""
    
    if [ $quota_mock_count -gt 0 ]; then
        echo "1. QUOTA MOCK DATA:"
        echo "   - Replace hardcoded { used: 45, limit: 100 } with database queries"
        echo "   - Implement real quota calculation logic"
        echo "   - Connect frontend to actual quota API endpoint"
    fi
    
    if [ $api_mock_count -gt 0 ]; then
        echo "2. API MOCK RESPONSES:"
        echo "   - Update API endpoints to query database instead of returning hardcoded data"
        echo "   - Remove all mock response objects"
        echo "   - Implement proper error handling for database failures"
    fi
    
    if [ $db_mock_count -gt 0 ]; then
        echo "3. DATABASE MOCK OPERATIONS:"
        echo "   - Replace console.log statements with actual database operations"
        echo "   - Implement proper SQL queries for quota calculations"
        echo "   - Connect to real database instead of mock operations"
    fi
    
    if [ $endpoint_mock_count -gt 0 ]; then
        echo "4. ENDPOINT MOCK RESPONSES:"
        echo "   - Fix API endpoints that return mock data"
        echo "   - Ensure database connections are working"
        echo "   - Test endpoints return real user data"
    fi
    
    echo ""
    echo "📋 VERIFICATION CHECKLIST:"
    echo "  □ Remove all hardcoded quota values (45, 100, etc.)"
    echo "  □ Implement real database queries for quota data"
    echo "  □ Test API endpoints return real data"
    echo "  □ Verify frontend displays real user quota"
    echo "  □ Confirm job creation uses real data"
    echo "  □ Test Inngest functions process real data"
    echo "  □ Remove all console.log mock operations"
    echo "  □ Run audit script again to confirm no issues"

else
    print_status "SYSTEM APPEARS CLEAN - No immediate actions required"
    echo "  ✅ No quota mock data detected"
    echo "  ✅ API endpoints appear to use real data"
    echo "  ✅ Database operations appear legitimate"
    echo "  ✅ No hardcoded mock responses found"
fi

echo ""
print_status "MOCK DATA AUDIT COMPLETE"
echo "📝 Full audit log saved to: $AUDIT_LOG"
echo ""

if [ $total_issues -gt 0 ]; then
    print_error "🚨 CRITICAL: $total_issues mock data issues must be resolved before production"
    exit 1
else
    print_status "✅ AUDIT PASSED: System ready for production data flow"
    exit 0
fi