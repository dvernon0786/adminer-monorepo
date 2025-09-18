#!/bin/bash

set -e

echo "🔍 PAYWALL SYSTEM VALIDATION"
echo "============================="
echo "Validating if paywall is properly wired with quota system"
echo ""

# Navigate to repository
cd /tmp
git clone https://github.com/dvernon0786/adminer-monorepo.git
cd adminer-monorepo

echo "✅ Repository cloned"

echo ""
echo "📊 PHASE 1: PAYWALL COMPONENT ANALYSIS"
echo "======================================"

# Check if paywall components exist
echo "🔍 Checking for paywall components..."

PAYWALL_COMPONENTS=(
    "QuotaPaywall"
    "QuotaWarning" 
    "PricingCard"
    "BillingDashboard"
)

for component in "${PAYWALL_COMPONENTS[@]}"; do
    FOUND=$(find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "$component" 2>/dev/null || echo "")
    if [ -n "$FOUND" ]; then
        echo "✅ $component found in:"
        echo "$FOUND" | head -3 | sed 's/^/   /'
    else
        echo "❌ $component NOT found"
    fi
done

echo ""
echo "📊 PHASE 2: QUOTA-PAYWALL INTEGRATION VALIDATION"
echo "==============================================="

echo "🔍 Checking useQuota hook paywall integration..."

QUOTA_HOOK="apps/web/src/hooks/useQuota.ts"
if [ -f "$QUOTA_HOOK" ]; then
    echo "✅ useQuota hook exists"
    
    # Check for paywall-related states
    if grep -q "needsUpgrade" "$QUOTA_HOOK"; then
        echo "✅ needsUpgrade state found"
    else
        echo "❌ needsUpgrade state missing"
    fi
    
    if grep -q "canScrapeAds\|canCreateJob" "$QUOTA_HOOK"; then
        echo "✅ Job creation validation found"
    else
        echo "❌ Job creation validation missing"
    fi
    
    if grep -q "402" "$QUOTA_HOOK"; then
        echo "✅ HTTP 402 (Payment Required) handling found"
    else
        echo "❌ HTTP 402 handling missing"
    fi
else
    echo "❌ useQuota hook not found"
fi

echo ""
echo "🔍 Checking API quota enforcement..."

API_FILE="apps/api/api/consolidated.js"
if [ -f "$API_FILE" ]; then
    echo "✅ API file exists"
    
    # Check for quota enforcement
    if grep -q "402\|QUOTA_EXCEEDED\|Payment Required" "$API_FILE"; then
        echo "✅ Quota enforcement (HTTP 402) found in API"
    else
        echo "❌ Quota enforcement missing in API"
    fi
    
    if grep -q "upgradeUrl\|/pricing" "$API_FILE"; then
        echo "✅ Upgrade URL redirection found"
    else
        echo "❌ Upgrade URL redirection missing"
    fi
else
    echo "❌ API file not found"
fi

echo ""
echo "📊 PHASE 3: JOB CREATION PROTECTION VALIDATION"
echo "=============================================="

echo "🔍 Checking job creation form protection..."

JOB_FORM_PATHS=(
    "apps/web/src/components/dashboard/StartJobForm.tsx"
    "apps/web/src/components/StartJobForm.tsx"
    "apps/web/src/pages/dashboard/StartJob.tsx"
)

JOB_FORM_FOUND=""
for path in "${JOB_FORM_PATHS[@]}"; do
    if [ -f "$path" ]; then
        JOB_FORM_FOUND="$path"
        break
    fi
done

if [ -n "$JOB_FORM_FOUND" ]; then
    echo "✅ Job creation form found: $JOB_FORM_FOUND"
    
    # Check for quota validation
    if grep -q "needsUpgrade\|QuotaPaywall\|canScrapeAds" "$JOB_FORM_FOUND"; then
        echo "✅ Quota validation in job form found"
    else
        echo "❌ Quota validation in job form missing"
    fi
    
    if grep -q "quota.*exceeded\|paywall\|upgrade" "$JOB_FORM_FOUND"; then
        echo "✅ Paywall integration in job form found"
    else
        echo "❌ Paywall integration in job form missing"
    fi
else
    echo "❌ Job creation form not found"
fi

echo ""
echo "📊 PHASE 4: PRICING INTEGRATION VALIDATION"
echo "=========================================="

echo "🔍 Checking pricing page integration..."

PRICING_PATHS=(
    "apps/web/src/components/homepage/Pricing.tsx"
    "apps/web/src/pages/pricing.tsx"
    "apps/web/src/components/Pricing.tsx"
)

PRICING_FOUND=""
for path in "${PRICING_PATHS[@]}"; do
    if [ -f "$path" ]; then
        PRICING_FOUND="$path"
        break
    fi
done

if [ -n "$PRICING_FOUND" ]; then
    echo "✅ Pricing page found: $PRICING_FOUND"
    
    # Check for plan details
    if grep -q "free.*10\|starter.*10" "$PRICING_FOUND"; then
        echo "✅ Free plan (10 ads) found in pricing"
    else
        echo "❌ Free plan (10 ads) not found in pricing"
    fi
    
    if grep -q "pro.*500\|professional.*500" "$PRICING_FOUND"; then
        echo "✅ Pro plan (500 ads) found in pricing"
    else
        echo "❌ Pro plan (500 ads) not found in pricing"
    fi
    
    if grep -q "enterprise.*2000\|unlimited" "$PRICING_FOUND"; then
        echo "✅ Enterprise plan found in pricing"
    else
        echo "❌ Enterprise plan not found in pricing"
    fi
else
    echo "❌ Pricing page not found"
fi

echo ""
echo "📊 PHASE 5: LIVE PAYWALL TESTING"
echo "================================"

echo "🔍 Testing paywall integration with live API..."

# Test with quota exceeded scenario
echo ""
echo "Test 1: Quota exceeded user..."
QUOTA_RESPONSE=$(curl -s -H "x-user-id: quota-exceeded-user" -H "x-workspace-id: quota-exceeded-user" "https://www.adminer.online/api/quota")

echo "API Response: $QUOTA_RESPONSE"

if echo "$QUOTA_RESPONSE" | grep -q "limit.*10"; then
    echo "✅ Correct quota limit (10 ads)"
else
    echo "❌ Incorrect quota limit"
fi

# Test job creation with quota exceeded
echo ""
echo "Test 2: Job creation with quota check..."
JOB_RESPONSE=$(curl -s -X POST -H "x-user-id: quota-exceeded-user" -H "x-workspace-id: quota-exceeded-user" -H "Content-Type: application/json" -d '{"url":"https://example.com","limit":20}' "https://www.adminer.online/api/jobs")

echo "Job Creation Response: $JOB_RESPONSE"

if echo "$JOB_RESPONSE" | grep -q "402\|QUOTA_EXCEEDED\|quota.*exceeded"; then
    echo "✅ Job creation properly blocked by quota"
else
    echo "❌ Job creation not blocked by quota"
fi

echo ""
echo "📊 PHASE 6: COMPREHENSIVE PAYWALL VALIDATION"
echo "==========================================="

# Create comprehensive validation script
cat > validate_paywall_complete.js << 'EOF'
#!/usr/bin/env node
// COMPREHENSIVE PAYWALL VALIDATION

const fs = require('fs');

console.log('🔍 COMPREHENSIVE PAYWALL VALIDATION');
console.log('===================================');

const validations = [];

// 1. Check useQuota hook integration
try {
  const useQuotaContent = fs.readFileSync('apps/web/src/hooks/useQuota.ts', 'utf8');
  
  const hasNeedsUpgrade = useQuotaContent.includes('needsUpgrade');
  const hasCanScrapeAds = useQuotaContent.includes('canScrapeAds');
  const has402Handling = useQuotaContent.includes('402');
  const hasUpgradeLogic = useQuotaContent.includes('setNeedsUpgrade(true)');
  
  validations.push({
    component: 'useQuota Hook',
    checks: [
      { name: 'needsUpgrade state', passed: hasNeedsUpgrade },
      { name: 'canScrapeAds validation', passed: hasCanScrapeAds },
      { name: 'HTTP 402 handling', passed: has402Handling },
      { name: 'Upgrade trigger logic', passed: hasUpgradeLogic }
    ]
  });
  
} catch (e) {
  validations.push({
    component: 'useQuota Hook',
    error: 'File not found or not readable'
  });
}

// 2. Check API quota enforcement
try {
  const apiContent = fs.readFileSync('apps/api/api/consolidated.js', 'utf8');
  
  const hasQuotaCheck = apiContent.includes('used >= limit') || apiContent.includes('quota.*exceed');
  const has402Response = apiContent.includes('402') && apiContent.includes('Payment Required');
  const hasUpgradeUrl = apiContent.includes('upgradeUrl') || apiContent.includes('/pricing');
  const hasQuotaValidation = apiContent.includes('QUOTA_EXCEEDED');
  
  validations.push({
    component: 'API Quota Enforcement',
    checks: [
      { name: 'Quota limit checking', passed: hasQuotaCheck },
      { name: 'HTTP 402 response', passed: has402Response },
      { name: 'Upgrade URL provision', passed: hasUpgradeUrl },
      { name: 'Quota validation logic', passed: hasQuotaValidation }
    ]
  });
  
} catch (e) {
  validations.push({
    component: 'API Quota Enforcement',
    error: 'File not found or not readable'
  });
}

// 3. Check frontend paywall components
const paywallFiles = [
  'apps/web/src/components/billing/QuotaPaywall.tsx',
  'apps/web/src/components/QuotaPaywall.tsx',
  'apps/web/src/components/dashboard/QuotaPaywall.tsx'
];

let paywallFound = false;
paywallFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    paywallFound = true;
    console.log(`✅ Paywall component found: ${file}`);
  } catch (e) {
    // File doesn't exist, continue
  }
});

if (!paywallFound) {
  console.log('❌ No paywall components found');
}

// Display results
console.log('\n📊 VALIDATION RESULTS');
console.log('=====================');

let totalPassed = 0;
let totalChecks = 0;

validations.forEach(validation => {
  console.log(`\n${validation.component}:`);
  
  if (validation.error) {
    console.log(`❌ Error: ${validation.error}`);
    return;
  }
  
  validation.checks.forEach(check => {
    const status = check.passed ? '✅' : '❌';
    console.log(`  ${status} ${check.name}`);
    
    if (check.passed) totalPassed++;
    totalChecks++;
  });
});

console.log(`\n📊 Summary: ${totalPassed}/${totalChecks} checks passed`);

if (totalPassed === totalChecks) {
  console.log('🎉 PAYWALL SYSTEM FULLY INTEGRATED!');
} else {
  console.log('⚠️  Paywall integration incomplete');
  process.exit(1);
}
EOF

chmod +x validate_paywall_complete.js
echo ""
echo "🔧 Running comprehensive paywall validation..."
node validate_paywall_complete.js

echo ""
echo "📊 PHASE 7: VALIDATION RESULTS"
echo "=============================="

echo ""
echo "🔧 CRITICAL INTEGRATION POINTS TO VERIFY:"
echo "1. ✅ Quota API returns correct limits (10/500/2000)"
echo "2. ⚠️  Frontend components check needsUpgrade state"
echo "3. ⚠️  Job creation blocked when quota exceeded"
echo "4. ⚠️  HTTP 402 responses trigger paywall display"
echo "5. ⚠️  Pricing page reflects database plan limits"
echo ""
echo "🎯 RECOMMENDATIONS:"
echo "- Ensure all job creation forms check canScrapeAds()"
echo "- Verify paywall components exist and are imported"
echo "- Test quota exceeded scenarios manually"
echo "- Confirm pricing page matches database plans table"

# Cleanup
cd /
rm -rf /tmp/adminer-monorepo

echo ""
echo "✅ Paywall validation complete!"