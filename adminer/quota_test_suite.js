#!/usr/bin/env node
// COMPREHENSIVE QUOTA SYSTEM TEST SUITE
// Tests all quota functionality end-to-end

const { execSync } = require('child_process');

console.log('🧪 COMPREHENSIVE QUOTA SYSTEM TEST SUITE');
console.log('========================================');

// Test configuration
const TEST_USER_ID = 'test-user-' + Date.now();
const API_BASE = process.env.API_BASE || 'https://www.adminer.online';

async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Quota API responds correctly
  try {
    console.log('\n🔬 Test 1: Quota API basic response...');
    
    const response = await fetch(`${API_BASE}/api/quota`, {
      method: 'GET',
      headers: {
        'x-user-id': TEST_USER_ID,
        'x-workspace-id': TEST_USER_ID,
      },
    });
    
    const data = await response.json();
    
    if (data.success && data.data.quotaUnit === 'ads_scraped') {
      console.log('✅ Test 1 PASSED: API returns ads_scraped quota');
      results.passed++;
      results.tests.push({ name: 'Quota API Response', status: 'PASSED', details: data.data });
    } else {
      throw new Error('API does not return ads_scraped quota unit');
    }
    
  } catch (error) {
    console.log('❌ Test 1 FAILED:', error.message);
    results.failed++;
    results.tests.push({ name: 'Quota API Response', status: 'FAILED', error: error.message });
  }

  // Test 2: Free plan has correct limit (10 ads, not 100)
  try {
    console.log('\n🔬 Test 2: Free plan quota limit...');
    
    const response = await fetch(`${API_BASE}/api/quota`, {
      headers: { 'x-user-id': TEST_USER_ID, 'x-workspace-id': TEST_USER_ID }
    });
    
    const data = await response.json();
    
    if (data.data.limit === 10 && data.data.planCode === 'free-10') {
      console.log('✅ Test 2 PASSED: Free plan has 10 ads limit');
      results.passed++;
      results.tests.push({ name: 'Free Plan Limit', status: 'PASSED', limit: data.data.limit });
    } else {
      throw new Error(`Expected limit: 10, got: ${data.data.limit}, plan: ${data.data.planCode}`);
    }
    
  } catch (error) {
    console.log('❌ Test 2 FAILED:', error.message);
    results.failed++;
    results.tests.push({ name: 'Free Plan Limit', status: 'FAILED', error: error.message });
  }

  // Test 3: Plans table integration
  try {
    console.log('\n🔬 Test 3: Plans table integration...');
    
    const response = await fetch(`${API_BASE}/api/quota`, {
      headers: { 'x-user-id': TEST_USER_ID, 'x-workspace-id': TEST_USER_ID }
    });
    
    const data = await response.json();
    
    if (data.data.debug?.quotaSource === 'plans_table') {
      console.log('✅ Test 3 PASSED: Quota comes from plans table');
      results.passed++;
      results.tests.push({ name: 'Plans Table Integration', status: 'PASSED' });
    } else {
      throw new Error('Quota not sourced from plans table');
    }
    
  } catch (error) {
    console.log('❌ Test 3 FAILED:', error.message);
    results.failed++;
    results.tests.push({ name: 'Plans Table Integration', status: 'FAILED', error: error.message });
  }

  // Test 4: No hardcoded values
  try {
    console.log('\n🔬 Test 4: No hardcoded quota values...');
    
    const response = await fetch(`${API_BASE}/api/quota`, {
      headers: { 'x-user-id': TEST_USER_ID, 'x-workspace-id': TEST_USER_ID }
    });
    
    const data = await response.json();
    
    // Should not have hardcoded 100 limit for free plan
    if (data.data.limit !== 100 || data.data.debug?.planFromDatabase) {
      console.log('✅ Test 4 PASSED: No hardcoded 100 limit found');
      results.passed++;
      results.tests.push({ name: 'No Hardcoded Values', status: 'PASSED' });
    } else {
      throw new Error('Found hardcoded 100 limit instead of plans table value');
    }
    
  } catch (error) {
    console.log('❌ Test 4 FAILED:', error.message);
    results.failed++;
    results.tests.push({ name: 'No Hardcoded Values', status: 'FAILED', error: error.message });
  }

  // Test 5: Quota calculation method
  try {
    console.log('\n🔬 Test 5: Quota calculation method...');
    
    const response = await fetch(`${API_BASE}/api/quota`, {
      headers: { 'x-user-id': TEST_USER_ID, 'x-workspace-id': TEST_USER_ID }
    });
    
    const data = await response.json();
    
    if (data.data.debug?.calculationMethod === 'ads_scraped_count') {
      console.log('✅ Test 5 PASSED: Uses ads_scraped_count calculation');
      results.passed++;
      results.tests.push({ name: 'Calculation Method', status: 'PASSED' });
    } else {
      throw new Error('Does not use ads_scraped_count calculation method');
    }
    
  } catch (error) {
    console.log('❌ Test 5 FAILED:', error.message);
    results.failed++;
    results.tests.push({ name: 'Calculation Method', status: 'FAILED', error: error.message });
  }

  // Test Results Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => t.status === 'FAILED').forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Quota system is working correctly:');
    console.log('- Uses plans table for limits');
    console.log('- Tracks ads scraped (not jobs)');
    console.log('- No hardcoded values');
    console.log('- Correct free plan limit (10 ads)');
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});