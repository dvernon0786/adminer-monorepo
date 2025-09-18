#!/usr/bin/env node
// QUOTA SYSTEM VALIDATION SCRIPT
// Ensures quota system integrity

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 QUOTA SYSTEM VALIDATION');
console.log('==========================');

// Check 1: No hardcoded 100 limits
console.log('\n1. Checking for hardcoded quota values...');
try {
  const result = execSync('grep -r "limit.*100\\|quota.*100" . --include="*.js" --include="*.ts" --exclude-dir=node_modules | grep -v backup', { encoding: 'utf8' });
  if (result.trim()) {
    console.log('❌ FOUND HARDCODED VALUES:');
    console.log(result);
  } else {
    console.log('✅ No hardcoded quota values found');
  }
} catch (e) {
  console.log('✅ No hardcoded quota values found');
}

// Check 2: Plans table usage
console.log('\n2. Checking plans table integration...');
try {
  const consolidated = fs.readFileSync('apps/api/api/consolidated.js', 'utf8');
  if (consolidated.includes('FROM plans') && consolidated.includes('monthly_quota')) {
    console.log('✅ Plans table integration found');
  } else {
    console.log('❌ Plans table integration missing');
  }
} catch (e) {
  console.log('❌ Could not check plans table integration');
}

// Check 3: Per-ad quota tracking
console.log('\n3. Checking per-ad quota tracking...');
try {
  const consolidated = fs.readFileSync('apps/api/api/consolidated.js', 'utf8');
  if (consolidated.includes('ads_scraped') && consolidated.includes('quotaUnit')) {
    console.log('✅ Per-ad quota tracking found');
  } else {
    console.log('❌ Per-ad quota tracking missing');
  }
} catch (e) {
  console.log('❌ Could not check per-ad quota tracking');
}

// Check 4: Frontend hook updates
console.log('\n4. Checking frontend hook updates...');
try {
  const useQuota = fs.readFileSync('apps/web/src/hooks/useQuota.ts', 'utf8');
  if (useQuota.includes('canScrapeAds') && useQuota.includes('quotaUnit')) {
    console.log('✅ Frontend hook updated for per-ad tracking');
  } else {
    console.log('❌ Frontend hook not updated for per-ad tracking');
  }
} catch (e) {
  console.log('❌ Could not check frontend hook');
}

console.log('\n📊 VALIDATION COMPLETE');
console.log('Run ./quota_test_suite.js to test the API endpoints');