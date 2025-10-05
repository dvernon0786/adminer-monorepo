#!/usr/bin/env node
// TEST SCRIPT FOR APIFY INTEGRATION
// Tests the enhanced Inngest functions with direct Apify API integration

const { apifyDirectService } = require('./src/inngest/functions-enhanced.js');

async function testApifyIntegration() {
  console.log('🧪 Testing Apify Integration...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`- APIFY_TOKEN: ${process.env.APIFY_TOKEN ? '✅ Set' : '❌ Not set'}`);
  console.log(`- APIFY_ACTOR_ID: ${process.env.APIFY_ACTOR_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}\n`);
  
  if (!process.env.APIFY_TOKEN) {
    console.log('⚠️ APIFY_TOKEN not found. Please set it in your environment:');
    console.log('export APIFY_TOKEN=your_apify_token_here');
    console.log('Get your token from: https://console.apify.com/account/integrations\n');
    return;
  }
  
  try {
    // Test 1: Health Check
    console.log('🏥 Test 1: Apify Health Check');
    const healthCheck = await apifyDirectService.healthCheck();
    console.log('Health Check Result:', healthCheck);
    console.log('');
    
    if (healthCheck.status !== 'healthy') {
      console.log('❌ Health check failed. Please check your APIFY_TOKEN and APIFY_ACTOR_ID');
      return;
    }
    
    // Test 2: Test Scraping
    console.log('🔍 Test 2: Test Scraping');
    const testResult = await apifyDirectService.testScraping();
    console.log('Test Scraping Result:', {
      status: testResult.status,
      dataExtracted: testResult.dataExtracted,
      processingTime: testResult.processingTime,
      hasData: testResult.data.length > 0,
      sampleData: testResult.data.length > 0 ? testResult.data[0] : null
    });
    console.log('');
    
    if (testResult.status === 'completed') {
      console.log('✅ Apify integration test PASSED!');
      console.log(`📊 Actor ran successfully - ${testResult.dataExtracted} items found`);
      console.log(`⏱️ Processing time: ${testResult.processingTime}ms`);
      console.log('ℹ️ Note: Facebook Ads Library often returns 0 results due to rate limiting or no active ads');
    } else {
      console.log('❌ Apify integration test FAILED');
      console.log('Error:', testResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testApifyIntegration().catch(console.error);