#!/usr/bin/env node

/**
 * Diagnose Failed Job Script
 * Analyzes why AI analysis failed for a specific job
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const JOB_ID = 'job-1761785340168-rroyfjze4';

async function diagnoseFailedJob() {
  console.log(`🔍 Diagnosing failed job: ${JOB_ID}\n`);

  try {
    // Connect to database
    const sql = neon(process.env.DATABASE_URL);
    
    // Query job by ID
    const jobResult = await sql`
      SELECT 
        id,
        org_id,
        status,
        error,
        raw_data,
        ai_analysis,
        content_type
      FROM jobs 
      WHERE id = ${JOB_ID}
    `;
    
    if (jobResult.length === 0) {
      console.log('❌ Job not found in database');
      return;
    }
    
    const job = jobResult[0];
    console.log('📊 Job Details:');
    console.log(`   ID: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Error: ${job.error || 'None'}`);
    console.log(`   Content Type: ${job.content_type || 'None'}`);
    console.log(`   Has Raw Data: ${!!job.raw_data}`);
    console.log(`   Has AI Analysis: ${!!job.ai_analysis}`);
    
    if (job.raw_data) {
      try {
        let scrapedData = typeof job.raw_data === 'string' ? JSON.parse(job.raw_data) : job.raw_data;
        const ads = scrapedData.data || scrapedData.results || [];
        console.log(`\n📋 Raw Data Analysis:`);
        console.log(`   Total ads in raw_data: ${ads.length}`);
        
        if (ads.length === 0) {
          console.log('\n❌ CRITICAL: No ads found in raw_data!');
          console.log('   This would cause "All ads failed AI analysis" error');
          return;
        }
        
        // Analyze first few ads
        console.log(`\n🔍 Analyzing first ${Math.min(3, ads.length)} ads:`);
        
        let adsWithText = 0;
        let adsWithImages = 0;
        let adsWithVideos = 0;
        let adsWithNoContent = 0;
        let adsWithInvalidStructure = 0;
        
        for (let i = 0; i < Math.min(3, ads.length); i++) {
          const ad = ads[i];
          console.log(`\n   Ad ${i + 1}:`);
          console.log(`     ad_archive_id: ${ad.ad_archive_id || '❌ MISSING'}`);
          console.log(`     Has snapshot: ${!!ad.snapshot}`);
          
          if (!ad.snapshot) {
            console.log(`     ❌ PROBLEM: Missing snapshot field`);
            adsWithInvalidStructure++;
            continue;
          }
          
          const hasText = ad.snapshot?.body?.text && ad.snapshot.body.text.trim().length > 0;
          const hasImages = ad.snapshot?.images?.length > 0 && 
            ad.snapshot.images[0]?.original_image_url;
          const hasVideos = ad.snapshot?.videos?.length > 0 &&
            ad.snapshot.videos.some(v => v.video_url?.includes('https://video'));
          
          console.log(`     Has body.text: ${hasText} (length: ${ad.snapshot.body?.text?.length || 0})`);
          console.log(`     Has images: ${hasImages} (count: ${ad.snapshot.images?.length || 0})`);
          if (hasImages) {
            console.log(`       First image URL: ${ad.snapshot.images[0]?.original_image_url?.substring(0, 80) || 'MISSING'}...`);
          }
          console.log(`     Has videos: ${hasVideos} (count: ${ad.snapshot.videos?.length || 0})`);
          if (hasVideos) {
            console.log(`       First video URL: ${ad.snapshot.videos[0]?.video_url?.substring(0, 80) || 'MISSING'}...`);
          }
          
          if (hasText) adsWithText++;
          if (hasImages) adsWithImages++;
          if (hasVideos) adsWithVideos++;
          if (!hasText && !hasImages && !hasVideos) {
            adsWithNoContent++;
            console.log(`     ⚠️  WARNING: Ad has no analyzable content (no text, images, or videos)`);
          }
        }
        
        // Summary
        console.log(`\n📊 Content Summary (analyzed ${Math.min(3, ads.length)} ads):`);
        console.log(`   ✅ Ads with text: ${adsWithText}`);
        console.log(`   ✅ Ads with images: ${adsWithImages}`);
        console.log(`   ✅ Ads with videos: ${adsWithVideos}`);
        console.log(`   ❌ Ads with no content: ${adsWithNoContent}`);
        console.log(`   ❌ Ads with invalid structure: ${adsWithInvalidStructure}`);
        
        // Test content type detection
        console.log(`\n🧪 Testing Content Type Detection:`);
        const { UnifiedApifyAnalyzer } = require('../../src/lib/unified-ai-analyzer.js');
        const analyzer = new UnifiedApifyAnalyzer();
        
        for (let i = 0; i < Math.min(2, ads.length); i++) {
          const ad = ads[i];
          try {
            const contentType = analyzer.detectContentType(ad);
            console.log(`   Ad ${i + 1} (${ad.ad_archive_id}): ${contentType}`);
          } catch (error) {
            console.log(`   Ad ${i + 1}: ❌ Error detecting content type - ${error.message}`);
          }
        }
        
      } catch (parseError) {
        console.error('\n❌ Failed to parse raw_data:', parseError.message);
        console.error('   This would prevent AI analysis from starting');
      }
    } else {
      console.log('\n❌ CRITICAL: No raw_data found!');
      console.log('   This would cause AI analysis to fail immediately');
    }
    
  } catch (error) {
    console.error('\n❌ Query error:', error.message);
    console.error(error.stack);
  }
}

// Run the diagnosis
diagnoseFailedJob().then(() => {
  console.log('\n✅ Diagnosis completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

