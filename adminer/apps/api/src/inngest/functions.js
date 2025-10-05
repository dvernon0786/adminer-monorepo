// ENHANCED INNGEST FUNCTION WITH DIRECT APIFY INTEGRATION
// Based on: https://docs.apify.com/api/v2#/reference/actors/run-actor-synchronously-and-get-dataset-items

const { inngest } = require("./client.js");
const { neon } = require("@neondatabase/serverless");
const { apifyDirectService } = require("../lib/apify-direct.js");
const { aiAnalyze } = require("./ai-analyze.js");

const database = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Enhanced Job Created Function with Direct Apify Integration
const jobCreatedFunction = inngest.createFunction(
  { id: "job-created" },
  { event: "job.created" },
  async ({ event }) => {
    // Move variable declarations outside try block to fix scope issue
    const { jobId, keyword, orgId } = event.data || {};
    
    console.log(`🚀 Processing enhanced job: ${jobId} for org: ${orgId}`);
    console.log(`📊 Event data:`, JSON.stringify(event.data, null, 2));
    console.log(`🔗 Database URL available:`, !!process.env.DATABASE_URL);
    console.log(`🔗 Database client:`, !!database);
    
    if (!orgId || !jobId) {
      throw new Error(`Missing required data: jobId=${jobId}, orgId=${orgId}`);
    }
    
    if (!database) {
      console.log("⚠️ Database not available, job processed locally only");
      return { success: true, jobId, orgId, note: "database unavailable" };
    }
    
    try {
    
    // Step 1: Ensure organization exists using UPSERT
    let organization;
    
    const orgResult = await database.query(`
      INSERT INTO organizations (id, clerk_org_id, name, plan, quota_limit, quota_used, created_at, updated_at) 
      VALUES (gen_random_uuid(), $1, $2, 'free', 10, 0, NOW(), NOW())
      ON CONFLICT (clerk_org_id) DO UPDATE SET 
        updated_at = NOW(),
        name = EXCLUDED.name
      RETURNING id, clerk_org_id, name, quota_used, quota_limit
    `, [orgId, `Organization ${orgId}`]);
    
    if (!orgResult || !Array.isArray(orgResult) || orgResult.length === 0) {
      throw new Error("Failed to ensure organization exists");
    }
    
    organization = orgResult[0];
    console.log(`✅ Organization ready: ${organization.id} (${organization.clerk_org_id})`);
      
    // Step 2: Create job record with "queued" status
    await database.query(`
      INSERT INTO jobs (id, org_id, type, status, input, created_at) 
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      jobId, 
      organization.id, 
      'scrape',
      'queued',
      JSON.stringify({ keyword, limit: 10 })
    ]);
    
    console.log(`✅ Job created: ${jobId} with status 'queued'`);
      
    // Step 3: Update job status to "running"
    await database.query(`
      UPDATE jobs 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2
    `, ['running', jobId]);
    
    console.log(`✅ Job status updated to 'running': ${jobId}`);
      
      // Step 4: Run Direct Apify Scraping
      console.log(`🔍 Starting direct Apify scrape for job: ${jobId}, keyword: ${keyword}`);
      
      const scrapeResults = await apifyDirectService.runScrapeJob({
        keyword: keyword,
        limit: 10
      });
      
      console.log(`📊 Apify scrape completed:`, {
        status: scrapeResults.status,
        dataExtracted: scrapeResults.dataExtracted,
        processingTime: scrapeResults.processingTime
      });
      
    // Step 5: Store scraped data and update job to "completed"
    await database.query(`
      UPDATE jobs 
      SET status = $1, raw_data = $2, updated_at = NOW()
      WHERE id = $3
    `, [
      'completed', 
      JSON.stringify(scrapeResults), 
      jobId
    ]);
    
    console.log(`✅ Job completed successfully: ${jobId}`);
      
    // Step 6: Update quota by actual ads scraped
    const adsScraped = scrapeResults.dataExtracted || 0;
    try {
      await database.query(`
        UPDATE organizations 
        SET quota_used = quota_used + $1, updated_at = NOW() 
        WHERE clerk_org_id = $2
      `, [adsScraped, orgId]);
      
      console.log(`✅ Quota updated for organization: ${orgId} (${adsScraped} ads consumed)`);
    } catch (quotaError) {
      console.error('⚠️ Failed to update quota:', quotaError);
      // Don't fail the job for quota update errors
    }
      
    // Step 7: Trigger AI Analysis (next phase)
    try {
      await inngest.send({
        name: "ai.analyze.start",
        data: {
          jobId: jobId,
          orgId: orgId,
          scraped_data: scrapeResults,
          keyword: keyword
        }
      });
      
      console.log(`✅ Triggered AI analysis for job: ${jobId}`);
    } catch (aiError) {
      console.error('⚠️ Failed to trigger AI analysis:', aiError);
      // Don't fail the job for AI analysis trigger errors
    }
      
      return { 
        success: true, 
        jobId, 
        orgId,
        status: 'completed',
        resultsCount: scrapeResults.dataExtracted,
        processingTime: scrapeResults.processingTime,
        message: 'Job completed with direct Apify scraping'
      };
      
    } catch (error) {
      console.error(`❌ Error processing job ${jobId} for org ${orgId}:`, error);
      console.error('Error stack:', error.stack);
      
      // Update job status to failed if it exists
      try {
        await database.query(`
          UPDATE jobs 
          SET status = $1, error = $2, updated_at = NOW()
          WHERE id = $3
        `, ['failed', error.message, jobId]);
        
        console.log(`✅ Job status updated to 'failed': ${jobId}`);
        
      } catch (updateError) {
        console.error('❌ Failed to update job status to failed:', updateError);
      }
      
      throw new Error(`Job processing failed: ${error.message}`);
    }
  }
);

// Export all functions for Inngest
module.exports = { 
  jobCreatedFunction, 
  aiAnalyze 
};