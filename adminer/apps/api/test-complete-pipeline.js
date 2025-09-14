#!/usr/bin/env node
// COMPLETE PIPELINE TEST SCRIPT
// Tests the entire job creation → Apify scraping → database storage pipeline

const { jobCreatedFunction } = require('./src/inngest/functions.js');
const { neon } = require('@neondatabase/serverless');

async function testCompletePipeline() {
  console.log('🚀 Testing Complete Apify Pipeline...\n');
  
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
  
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not found. Please set it in your environment:');
    console.log('export DATABASE_URL=your_neon_database_url\n');
    return;
  }
  
  try {
    // Test data
    const testJobId = `test-job-${Date.now()}`;
    const testOrgId = `test-org-${Date.now()}`;
    const testKeyword = 'web scraping tools';
    
    console.log('📝 Test Data:');
    console.log(`- Job ID: ${testJobId}`);
    console.log(`- Org ID: ${testOrgId}`);
    console.log(`- Keyword: ${testKeyword}\n`);
    
    // Test 1: Create Inngest Event
    console.log('🎯 Test 1: Creating Inngest Event');
    const event = {
      name: 'job.created',
      data: {
        jobId: testJobId,
        orgId: testOrgId,
        keyword: testKeyword
      }
    };
    
    console.log('Event created:', event);
    console.log('');
    
    // Test 2: Execute Job Function
    console.log('⚡ Test 2: Executing Job Function');
    const startTime = Date.now();
    
    // Inngest functions need to be called with the function's handler
    const result = await jobCreatedFunction.fn({ event });
    
    const processingTime = Date.now() - startTime;
    console.log('Job Function Result:', result);
    console.log(`Processing Time: ${processingTime}ms\n`);
    
    // Test 3: Verify Database Storage
    console.log('🗄️ Test 3: Verifying Database Storage');
    
    const database = neon(process.env.DATABASE_URL);
    
    // Check organization
    const orgResult = await database.query(
      'SELECT * FROM organizations WHERE clerk_org_id = $1',
      [testOrgId]
    );
    console.log('Organization in DB:', orgResult.length > 0 ? '✅ Found' : '❌ Not found');
    if (orgResult.length > 0) {
      console.log('Org details:', {
        id: orgResult[0].id,
        name: orgResult[0].name,
        quota_used: orgResult[0].quota_used,
        quota_limit: orgResult[0].quota_limit
      });
    }
    
    // Check job
    const jobResult = await database.query(
      'SELECT * FROM jobs WHERE id = $1',
      [testJobId]
    );
    console.log('Job in DB:', jobResult.length > 0 ? '✅ Found' : '❌ Not found');
    if (jobResult.length > 0) {
      console.log('Job details:', {
        id: jobResult[0].id,
        status: jobResult[0].status,
        type: jobResult[0].type,
        has_output: !!jobResult[0].output,
        output_size: jobResult[0].output ? JSON.parse(jobResult[0].output).data?.length || 0 : 0
      });
      
      // Show sample output data
      if (jobResult[0].output) {
        const output = JSON.parse(jobResult[0].output);
        console.log('Sample output data:', {
          status: output.status,
          dataExtracted: output.dataExtracted,
          processingTime: output.processingTime,
          sampleItem: output.data?.[0] || null
        });
      }
    }
    
    console.log('');
    
    // Test 4: Summary
    console.log('📊 Test 4: Summary');
    if (result.success && orgResult.length > 0 && jobResult.length > 0) {
      console.log('✅ COMPLETE PIPELINE TEST PASSED!');
      console.log('✅ Job created and processed successfully');
      console.log('✅ Organization created in database');
      console.log('✅ Job stored in database with results');
      console.log('✅ Apify scraping completed');
      console.log(`✅ Total processing time: ${processingTime}ms`);
    } else {
      console.log('❌ COMPLETE PIPELINE TEST FAILED');
      console.log('Issues found:');
      if (!result.success) console.log('- Job function failed');
      if (orgResult.length === 0) console.log('- Organization not found in database');
      if (jobResult.length === 0) console.log('- Job not found in database');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCompletePipeline().catch(console.error);