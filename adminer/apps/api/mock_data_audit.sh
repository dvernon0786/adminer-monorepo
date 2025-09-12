#!/bin/bash

# Comprehensive Mock Data Audit Script
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
print_info "PHASE 1: QUOTA MOCK DATA DETECTION"

echo "🔍 Searching for quota mock data patterns:"
QUOTA_MOCK_PATTERNS=(
    "used.*45"
    "limit.*100" 
    "percentage.*45"
    "quotaUsed.*45"
    "quotaLimit.*100"
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
print_info "PHASE 2: API ENDPOINT TESTING"

echo "🔍 Testing API endpoints for mock responses:"

# Test quota endpoint specifically
echo "  🌐 Testing quota endpoint:"
quota_response=$(curl -s "https://adminer-api-fixed.vercel.app/api/quota" 2>/dev/null || echo "FAILED")

if [[ "$quota_response" != "FAILED" ]]; then
    if [[ "$quota_response" == *"used"*"45"* ]] || [[ "$quota_response" == *"limit"*"100"* ]]; then
        print_error "    MOCK DATA DETECTED in quota response:"
        echo "    $quota_response"
        echo "ENDPOINT_MOCK: quota" >> $AUDIT_LOG
        echo "Response: $quota_response" >> $AUDIT_LOG
    else
        print_status "    Quota response appears to use real data"
        echo "    $quota_response"
    fi
else
    print_warning "    Quota endpoint not accessible"
fi

# Test jobs endpoint
echo "  🌐 Testing jobs endpoint:"
jobs_response=$(curl -s "https://adminer-api-fixed.vercel.app/api/jobs" 2>/dev/null || echo "FAILED")

if [[ "$jobs_response" != "FAILED" ]]; then
    print_status "    Jobs endpoint response:"
    echo "    $jobs_response" | head -c 200
else
    print_warning "    Jobs endpoint not accessible"
fi

echo ""
print_info "PHASE 3: FILE AUDIT"

echo "🔍 Checking critical files for mock data:"

# Check consolidated.js for mock responses
if [ -f "api/consolidated.js" ]; then
    echo "  📄 Checking api/consolidated.js:"
    quota_lines=$(grep -n -i "used.*45\|limit.*100\|percentage.*45" "api/consolidated.js" 2>/dev/null || true)
    if [ ! -z "$quota_lines" ]; then
        print_error "    Found quota mock data in consolidated.js:"
        echo "$quota_lines"
        echo "FILE_QUOTA_MOCK: api/consolidated.js" >> $AUDIT_LOG
        echo "$quota_lines" >> $AUDIT_LOG
    else
        print_status "    No quota mock data found in consolidated.js"
    fi
fi

# Check for hardcoded returns
hardcoded_lines=$(grep -n -E "return.*\{.*used.*\}" "api/consolidated.js" 2>/dev/null || true)
if [ ! -z "$hardcoded_lines" ]; then
    print_error "    Found hardcoded return data in consolidated.js:"
    echo "$hardcoded_lines"
    echo "FILE_HARDCODED: api/consolidated.js" >> $AUDIT_LOG
    echo "$hardcoded_lines" >> $AUDIT_LOG
fi

echo ""
print_info "PHASE 4: AUDIT SUMMARY"

# Count issues found
quota_mock_count=$(grep -c "QUOTA_MOCK_FOUND" $AUDIT_LOG 2>/dev/null || echo "0")
file_mock_count=$(grep -c "FILE_QUOTA_MOCK\|FILE_HARDCODED" $AUDIT_LOG 2>/dev/null || echo "0")
endpoint_mock_count=$(grep -c "ENDPOINT_MOCK" $AUDIT_LOG 2>/dev/null || echo "0")

total_issues=$((quota_mock_count + file_mock_count + endpoint_mock_count))

echo ""
echo "📋 AUDIT SUMMARY"
echo "================"

if [ $total_issues -gt 0 ]; then
    print_error "CRITICAL ISSUES FOUND: $total_issues total mock data issues"
    echo "  - Quota mock patterns: $quota_mock_count"
    echo "  - File mock data: $file_mock_count"
    echo "  - Endpoint mock responses: $endpoint_mock_count"
    echo ""
    print_error "SYSTEM IS NOT PRODUCTION READY - Mock data must be eliminated"
else
    print_status "NO CRITICAL MOCK DATA ISSUES FOUND"
    print_status "System appears to use real data"
fi

echo ""
print_status "MOCK DATA AUDIT COMPLETE"
echo "📝 Full audit log saved to: $AUDIT_LOG"

if [ $total_issues -gt 0 ]; then
    print_error "🚨 CRITICAL: $total_issues mock data issues must be resolved before production"
    exit 1
else
    print_status "✅ AUDIT PASSED: System ready for production data flow"
    exit 0
fi
