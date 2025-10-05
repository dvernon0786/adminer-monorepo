#!/usr/bin/env node

// DEBUG RAW DATA STORAGE
// Check what's actually stored in the raw_data column

const { neon } = require('@neondatabase/serverless');

async function debugRawData() {
  console.log('🔍 DEBUGGING RAW DATA STORAGE...\n');

  try {
    // Connect to database
    const database = neon(process.env.DATABASE_URL);
    
    if (!database) {
      console.error('❌ Database connection not available');
      return;
    }

    // Query recent jobs with raw data
    console.log('📊 Querying recent jobs with raw_data...');
    const jobs = await database.query(`
      SELECT 
        id, 
        keyword, 
        status, 
        created_at,
        updated_at,
        raw_data,
        jsonb_typeof(raw_data) as data_type
      FROM jobs 
      WHERE created_at > NOW() - INTERVAL '2 hours'
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log(`\n📋 Found ${jobs.length} recent jobs:\n`);
    
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job.id}`);
      console.log(`   Keyword: ${job.keyword}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Data Type: ${job.data_type}`);
      console.log(`   Raw Data: ${JSON.stringify(job.raw_data, null, 2)}`);
      console.log('');
    });

    // Check if there are any jobs with actual array data
    const arrayJobs = await database.query(`
      SELECT 
        id, 
        keyword, 
        status,
        jsonb_array_length(raw_data) as array_length
      FROM jobs 
      WHERE jsonb_typeof(raw_data) = 'array' 
        AND jsonb_array_length(raw_data) > 0
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log(`\n📊 Jobs with array data: ${arrayJobs.length}`);
    arrayJobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job.id} - Array length: ${job.array_length}`);
    });

  } catch (error) {
    console.error('❌ Error debugging raw data:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run debugging
debugRawData().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});