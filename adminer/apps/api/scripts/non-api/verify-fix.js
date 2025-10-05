#!/usr/bin/env node

// VERIFY APIFY DATA EXTRACTION FIX
// Check if the fix worked by querying the database for recent jobs

const { neon } = require('@neondatabase/serverless');

async function verifyFix() {
  console.log('🔍 VERIFYING APIFY DATA EXTRACTION FIX...\n');

  try {
    // Connect to database
    const database = neon(process.env.DATABASE_URL);
    
    if (!database) {
      console.error('❌ Database connection not available');
      return;
    }

    // Query recent jobs
    console.log('📊 Querying recent jobs...');
    const jobs = await database.query(`
      SELECT 
        id, 
        keyword, 
        status, 
        created_at,
        updated_at,
        CASE 
          WHEN raw_data IS NULL THEN 'NULL'
          WHEN raw_data = '[]'::jsonb THEN 'EMPTY_ARRAY'
          WHEN jsonb_typeof(raw_data) = 'array' AND jsonb_array_length(raw_data) = 0 THEN 'ZERO_LENGTH'
          WHEN jsonb_typeof(raw_data) = 'array' THEN 'HAS_DATA'
          ELSE 'NOT_ARRAY'
        END as data_status,
        CASE 
          WHEN raw_data IS NULL THEN 0
          WHEN raw_data = '[]'::jsonb THEN 0
          WHEN jsonb_typeof(raw_data) = 'array' THEN jsonb_array_length(raw_data)
          ELSE 0
        END as data_count
      FROM jobs 
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    console.log(`\n📋 Found ${jobs.length} recent jobs:\n`);
    
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job.id}`);
      console.log(`   Keyword: ${job.keyword}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Data Status: ${job.data_status}`);
      console.log(`   Data Count: ${job.data_count}`);
      console.log(`   Created: ${job.created_at}`);
      console.log(`   Updated: ${job.updated_at}`);
      console.log('');
    });

    // Check for jobs with actual data
    const jobsWithData = jobs.filter(job => job.data_status === 'HAS_DATA');
    const jobsWithEmptyData = jobs.filter(job => job.data_status === 'EMPTY_ARRAY' || job.data_status === 'ZERO_LENGTH');

    console.log('📊 SUMMARY:');
    console.log(`   ✅ Jobs with data: ${jobsWithData.length}`);
    console.log(`   ❌ Jobs with empty data: ${jobsWithEmptyData.length}`);
    console.log(`   📈 Total recent jobs: ${jobs.length}`);

    if (jobsWithData.length > 0) {
      console.log('\n🎉 SUCCESS! The fix is working - jobs have real data!');
      
      // Show sample data from first job with data
      const sampleJob = jobsWithData[0];
      console.log(`\n📄 Sample data from job ${sampleJob.id}:`);
      
      const sampleData = await database.query(`
        SELECT raw_data 
        FROM jobs 
        WHERE id = $1
      `, [sampleJob.id]);
      
      if (sampleData && sampleData[0] && sampleData[0].raw_data) {
        const rawData = sampleData[0].raw_data;
        console.log(`   Data type: ${Array.isArray(rawData) ? 'Array' : typeof rawData}`);
        console.log(`   Data length: ${Array.isArray(rawData) ? rawData.length : 'N/A'}`);
        
        if (Array.isArray(rawData) && rawData.length > 0) {
          console.log(`   First item keys: ${Object.keys(rawData[0]).join(', ')}`);
          console.log(`   Sample title: ${rawData[0].title || 'N/A'}`);
          console.log(`   Sample advertiser: ${rawData[0].advertiser || 'N/A'}`);
        }
      }
    } else if (jobsWithEmptyData.length > 0) {
      console.log('\n⚠️  WARNING: Jobs still have empty data. The fix may not be fully deployed yet.');
      console.log('   This could be due to:');
      console.log('   - Vercel deployment still in progress');
      console.log('   - Inngest functions not yet updated');
      console.log('   - Apify response format different than expected');
    } else {
      console.log('\n❓ No recent jobs found. Try creating a new job and check again.');
    }

  } catch (error) {
    console.error('❌ Error verifying fix:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run verification
verifyFix().then(() => {
  console.log('\n✅ Verification complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});