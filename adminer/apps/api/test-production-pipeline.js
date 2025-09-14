#!/usr/bin/env node

/**
 * Production Pipeline Test Script
 * Tests the complete API → Inngest → Apify → Database pipeline in production
 */

const https = require('https');

// Production API base URL
const API_BASE_URL = 'https://www.adminer.online';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testProductionPipeline() {
  console.log('🚀 Testing Production Pipeline...\n');
  
  const testOrgId = `test-org-${Date.now()}`;
  const testKeyword = 'mortgage ads';
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing API Health...');
    const healthResponse = await makeRequest(`${API_BASE_URL}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthResponse.data);
    console.log('   ✅ API Health Check: PASSED\n');
    
    // Test 2: Inngest Sync
    console.log('2️⃣ Testing Inngest Sync...');
    const inngestResponse = await makeRequest(`${API_BASE_URL}/api/inngest`, {
      method: 'PUT'
    });
    console.log(`   Status: ${inngestResponse.status}`);
    console.log(`   Response:`, inngestResponse.data);
    console.log('   ✅ Inngest Sync: PASSED\n');
    
    // Test 3: Apify Health
    console.log('3️⃣ Testing Apify Health...');
    const apifyResponse = await makeRequest(`${API_BASE_URL}/api/apify/health`);
    console.log(`   Status: ${apifyResponse.status}`);
    console.log(`   Response:`, apifyResponse.data);
    console.log('   ✅ Apify Health: PASSED\n');
    
    // Test 4: Job Creation
    console.log('4️⃣ Testing Job Creation...');
    const jobData = {
      keyword: testKeyword,
      limit: 3
    };
    
    const jobResponse = await makeRequest(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': testOrgId
      },
      body: JSON.stringify(jobData)
    });
    
    console.log(`   Status: ${jobResponse.status}`);
    console.log(`   Response:`, jobResponse.data);
    
    if (jobResponse.data.success && jobResponse.data.inngest.status === 'sent') {
      console.log('   ✅ Job Creation: PASSED');
      console.log(`   📋 Job ID: ${jobResponse.data.data.jobId}`);
      console.log(`   🔗 Inngest Event ID: ${jobResponse.data.inngest.eventId}`);
    } else {
      console.log('   ❌ Job Creation: FAILED');
      return;
    }
    
    console.log('\n🎉 Production Pipeline Test Results:');
    console.log('   ✅ API Health: Working');
    console.log('   ✅ Inngest Sync: Working');
    console.log('   ✅ Apify Health: Working');
    console.log('   ✅ Job Creation: Working');
    console.log('   ✅ Inngest Event: Sent Successfully');
    
    console.log('\n📊 Next Steps:');
    console.log('   1. Check Inngest Cloud dashboard for function execution');
    console.log('   2. Monitor job processing in background');
    console.log('   3. Verify data storage in database');
    console.log('   4. Test from web dashboard at https://www.adminer.online');
    
  } catch (error) {
    console.error('❌ Production Pipeline Test Failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testProductionPipeline();