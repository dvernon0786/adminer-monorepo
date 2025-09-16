#!/usr/bin/env node

// TEST APIFY FIX LOCALLY
// Test the apify-direct.js fix to ensure it works correctly

const { apifyDirectService } = require('./src/lib/apify-direct.js');

async function testApifyFix() {
  console.log('🧪 TESTING APIFY FIX LOCALLY...\n');

  try {
    // Test the apify service directly
    console.log('🔍 Testing apifyDirectService.runScrapeJob...');
    
    const result = await apifyDirectService.runScrapeJob({
      keyword: 'insurance',
      limit: 3
    });

    console.log('\n📊 RESULT:');
    console.log('Status:', result.status);
    console.log('Data Extracted:', result.dataExtracted);
    console.log('Data Type:', Array.isArray(result.data) ? 'Array' : typeof result.data);
    console.log('Data Length:', Array.isArray(result.data) ? result.data.length : 'N/A');
    
    if (Array.isArray(result.data) && result.data.length > 0) {
      console.log('\n🎉 SUCCESS! The fix is working - data is being extracted correctly!');
      console.log('First item keys:', Object.keys(result.data[0]).join(', '));
      console.log('Sample title:', result.data[0].title || 'N/A');
      console.log('Sample advertiser:', result.data[0].advertiser || 'N/A');
    } else {
      console.log('\n❌ ISSUE: Data is still empty or not an array');
      console.log('Raw data:', JSON.stringify(result.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run test
testApifyFix().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});