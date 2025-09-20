#!/usr/bin/env node

// Test script to verify DirectCheckoutModal fix
const https = require('https');
const { URL } = require('url');

async function testDirectCheckoutFix() {
  console.log('🧪 TESTING DIRECT CHECKOUT FIX V3');
  console.log('=================================');
  
  console.log('Expected behavior:');
  console.log('1. User at 100% quota sees DirectCheckoutModal');
  console.log('2. Clicking "Upgrade Now" calls /api/dodo/checkout directly');
  console.log('3. User redirected to Dodo checkout URL (NOT /pricing)');
  console.log('4. Console shows DIRECT_CHECKOUT_V3_* logs');
  console.log('');
  
  console.log('Console logs to watch for:');
  console.log('- DIRECT_CHECKOUT_MODAL_V3_LOADED');
  console.log('- DIRECT_CHECKOUT_V3_INITIATED');
  console.log('- DIRECT_CHECKOUT_V3_API_RESPONSE');
  console.log('- DIRECT_CHECKOUT_V3_SUCCESS');
  console.log('- DIRECT_CHECKOUT_V3_REDIRECTING');
  console.log('');
  
  console.log('What should NOT happen:');
  console.log('- NO redirect to /pricing?plan=pro');
  console.log('- NO "PRICING: Using fallback workspace" log');
  console.log('- NO pricing page access');
  console.log('');
  
  // Test Dodo API availability
  try {
    console.log('Testing Dodo checkout API...');
    
    const testPro = await fetch('https://adminer.online/api/dodo/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-direct-checkout',
        'x-workspace-id': 'test-direct-checkout'
      },
      body: JSON.stringify({
        plan: 'pro-500',
        email: 'test@example.com',
        orgName: 'Test Organization'
      })
    });
    
    if (testPro.ok) {
      console.log('✅ Dodo Pro checkout API working');
    } else {
      console.log('❌ Dodo Pro checkout API error:', testPro.status);
    }
    
  } catch (error) {
    console.log('⚠️ Could not test Dodo API (expected if running locally)');
  }
  
  console.log('');
  console.log('🎯 VALIDATION CHECKLIST:');
  console.log('□ Clear browser cache completely');
  console.log('□ Navigate to dashboard with 100% quota');
  console.log('□ Verify DirectCheckoutModal appears (not old modal)');
  console.log('□ See DIRECT_CHECKOUT_MODAL_V3_LOADED in console');
  console.log('□ Click "Upgrade to Pro" button');
  console.log('□ See DIRECT_CHECKOUT_V3_* logs in console');
  console.log('□ Verify redirect goes to Dodo checkout (NOT /pricing)');
  console.log('□ Test both Pro and Enterprise upgrade buttons');
}

testDirectCheckoutFix();