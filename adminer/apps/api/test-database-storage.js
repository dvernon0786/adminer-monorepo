#!/usr/bin/env node

/**
 * Database Storage Verification Test
 * Tests if jobs are being stored in the production database
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseStorage() {
  console.log('🗄️ Testing Database Storage...\n');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in environment');
    console.log('   Please check your .env.local file');
    return;
  }
  
  const database = neon(process.env.DATABASE_URL);
  
  try {
    // Test 1: Check if orgs table exists and has data
    console.log('1️⃣ Checking organizations table...');
    const orgsResult = await database.query('SELECT COUNT(*) as count FROM orgs');
    console.log(`   Organizations count: ${orgsResult[0].count}`);
    
    // Test 2: Check if jobs table exists and has data
    console.log('\n2️⃣ Checking jobs table...');
    const jobsResult = await database.query('SELECT COUNT(*) as count FROM jobs');
    console.log(`   Jobs count: ${jobsResult[0].count}`);
    
    // Test 3: Get recent jobs
    console.log('\n3️⃣ Getting recent jobs...');
    const recentJobs = await database.query(`
      SELECT id, org_id, keyword, status, created_at, updated_at
      FROM jobs 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('   Recent jobs:');
    recentJobs.forEach((job, index) => {
      console.log(`   ${index + 1}. Job ID: ${job.id}`);
      console.log(`      Keyword: ${job.keyword}`);
      console.log(`      Status: ${job.status}`);
      console.log(`      Created: ${job.created_at}`);
      console.log(`      Updated: ${job.updated_at}`);
      console.log('');
    });
    
    // Test 4: Check for jobs with raw_data
    console.log('4️⃣ Checking for jobs with raw_data...');
    const jobsWithData = await database.query(`
      SELECT id, keyword, status, 
             CASE WHEN raw_data IS NOT NULL THEN 'Has Data' ELSE 'No Data' END as data_status,
             LENGTH(raw_data::text) as data_length
      FROM jobs 
      WHERE raw_data IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    if (jobsWithData.length > 0) {
      console.log('   Jobs with scraped data:');
      jobsWithData.forEach((job, index) => {
        console.log(`   ${index + 1}. Job ID: ${job.id}`);
        console.log(`      Keyword: ${job.keyword}`);
        console.log(`      Status: ${job.status}`);
        console.log(`      Data Status: ${job.data_status}`);
        console.log(`      Data Length: ${job.data_length} characters`);
        console.log('');
      });
    } else {
      console.log('   No jobs with raw_data found yet');
      console.log('   This is expected if jobs are still processing or if no data was scraped');
    }
    
    // Test 5: Check quota usage
    console.log('5️⃣ Checking quota usage...');
    const quotaResult = await database.query(`
      SELECT id, name, quota_used, quota_limit, 
             ((quota_used::float / quota_limit::float) * 100)::numeric(5,2) as usage_percentage
      FROM orgs 
      ORDER BY quota_used DESC 
      LIMIT 3
    `);
    
    console.log('   Organization quota usage:');
    quotaResult.forEach((org, index) => {
      console.log(`   ${index + 1}. Org ID: ${org.id}`);
      console.log(`      Name: ${org.name}`);
      console.log(`      Used: ${org.quota_used}/${org.quota_limit} (${org.usage_percentage}%)`);
      console.log('');
    });
    
    console.log('✅ Database Storage Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Organizations: ${orgsResult[0].count}`);
    console.log(`   - Jobs: ${jobsResult[0].count}`);
    console.log(`   - Jobs with data: ${jobsWithData.length}`);
    
  } catch (error) {
    console.error('❌ Database Storage Test Failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
testDatabaseStorage();