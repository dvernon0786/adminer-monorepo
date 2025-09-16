#!/usr/bin/env node

/**
 * Query Job Data Script
 * Retrieves job data and raw scraped data from Neon database
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function queryJobData() {
  console.log('🔍 Querying job data for job-1757891392156-ckupkz7sd...\n');

  try {
    // Connect to database
    const sql = neon(process.env.DATABASE_URL);
    
    // Query job by ID
    const jobQuery = `
      SELECT 
        id,
        org_id,
        type,
        status,
        input,
        raw_data,
        error,
        started_at,
        completed_at,
        created_at,
        updated_at
      FROM jobs 
      WHERE id = 'job-1757891392156-ckupkz7sd'
    `;
    
    console.log('📊 Executing job query...');
    const jobResult = await sql(jobQuery);
    
    if (jobResult.length === 0) {
      console.log('❌ Job not found in database');
      return;
    }
    
    const job = jobResult[0];
    console.log('✅ Job found in database!');
    console.log('\n📋 Job Details:');
    console.log(`   ID: ${job.id}`);
    console.log(`   Organization: ${job.org_id}`);
    console.log(`   Type: ${job.type}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Input: ${JSON.stringify(job.input, null, 2)}`);
    console.log(`   Started At: ${job.started_at}`);
    console.log(`   Completed At: ${job.completed_at}`);
    console.log(`   Created At: ${job.created_at}`);
    console.log(`   Updated At: ${job.updated_at}`);
    
    if (job.error) {
      console.log(`\n❌ Error: ${job.error}`);
    }
    
    // Check if raw data exists
    if (job.raw_data) {
      console.log('\n🎉 Raw scraped data found!');
      console.log('\n📊 Raw Data Structure:');
      console.log(JSON.stringify(job.raw_data, null, 2));
      
      // Analyze raw data structure
      if (job.raw_data.data && Array.isArray(job.raw_data.data)) {
        console.log(`\n📈 Data Analysis:`);
        console.log(`   Total ads scraped: ${job.raw_data.data.length}`);
        console.log(`   Processing time: ${job.raw_data.stats?.processingTime || 'N/A'}ms`);
        console.log(`   Run ID: ${job.raw_data.runId || 'N/A'}`);
        console.log(`   Dataset ID: ${job.raw_data.defaultDatasetId || 'N/A'}`);
        
        // Display individual ad records
        if (job.raw_data.data.length > 0) {
          console.log('\n🎯 Individual Ad Records:');
          job.raw_data.data.forEach((ad, index) => {
            console.log(`\n   Ad ${index + 1}:`);
            console.log(`     Title: ${ad.title || 'N/A'}`);
            console.log(`     Advertiser: ${ad.advertiser || 'N/A'}`);
            console.log(`     URL: ${ad.url || 'N/A'}`);
            console.log(`     Image URL: ${ad.imageUrl || 'N/A'}`);
            console.log(`     Text: ${ad.text || 'N/A'}`);
            console.log(`     Targeting: ${ad.targeting || 'N/A'}`);
            console.log(`     Spend: ${ad.spend || 'N/A'}`);
            console.log(`     Impressions: ${ad.impressions || 'N/A'}`);
            console.log(`     Created At: ${ad.createdAt || 'N/A'}`);
          });
        }
      } else {
        console.log('\n⚠️ Raw data exists but no ad records found');
        console.log('Raw data content:', JSON.stringify(job.raw_data, null, 2));
      }
    } else {
      console.log('\n⚠️ No raw data found for this job');
      console.log('This could mean:');
      console.log('   - Job is still processing');
      console.log('   - Apify scraping failed');
      console.log('   - Data was not stored properly');
    }
    
  } catch (error) {
    console.error('❌ Database query failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the query
queryJobData().then(() => {
  console.log('\n✅ Query completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});