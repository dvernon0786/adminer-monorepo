// ENHANCED INNGEST FUNCTION WITH DIRECT APIFY INTEGRATION
// Based on: https://docs.apify.com/api/v2#/reference/actors/run-actor-synchronously-and-get-dataset-items

const { inngest } = require("./client.js");
const { neon } = require("@neondatabase/serverless");
const { apifyDirectService } = require("../lib/apify-direct.js");

const database = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Enhanced Job Created Function with Direct Apify Integration
const jobCreatedFunction = inngest.createFunction(
  { id: "job-created" },
  { event: "job.created" },
  async ({ event }) => {
    const { jobId, keyword, orgId } = event.data || {};
    
    console.log(`🚀 Processing enhanced job: ${jobId} for org: ${orgId}`);
    
    if (!database) {
      console.log("⚠️ Database not available, job processed locally only");
      return { success: true, jobId, orgId, note: "database unavailable" };
    }
    
    if (!orgId || !jobId) {
      throw new Error(`Missing required data: jobId=${jobId}, orgId=${orgId}`);
    }
    
    try {
      // Step 1: Ensure organization exists using UPSERT
      let organization;
      
      try {
        const orgResult = await database.query(`
          INSERT INTO orgs (id, name, plan, status, quota_limit, quota_used, created_at, updated_at) 
          VALUES ($1, $2, 'free', 'active', 10, 0, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET 
            updated_at = NOW(),
            name = EXCLUDED.name
          RETURNING id, name, quota_used, quota_limit
        `, [orgId, `Organization ${orgId}`]);
        
        if (!orgResult || !Array.isArray(orgResult) || orgResult.length === 0) {
          throw new Error("Failed to ensure organization exists");
        }
        
        organization = orgResult[0];
        console.log(`✅ Organization ready: ${organization.id} (${organization.clerk_org_id})`);
        
      } catch (orgError) {
        console.error('❌ Organization creation failed:', orgError);
        throw new Error(`Organization setup failed: ${orgError.message}`);
      }
      
      // Step 2: Create job record with "queued" status
      try {
        await database.query(`
          INSERT INTO jobs (id, org_id, requested_by, keyword, status, input, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          jobId, 
          organization.id, 
          'api',
          keyword,
          'queued',
          JSON.stringify({ keyword, limit: 10 })
        ]);
        
        console.log(`✅ Job created: ${jobId} with status 'queued'`);
        
      } catch (jobError) {
        console.error('❌ Failed to create job:', jobError);
        throw new Error(`Failed to create job: ${jobError.message}`);
      }
      
      // Step 3: Update job status to "running"
      try {
        await database.query(`
          UPDATE jobs 
          SET status = $1, updated_at = NOW() 
          WHERE id = $2
        `, ['running', jobId]);
        
        console.log(`✅ Job status updated to 'running': ${jobId}`);
        
      } catch (updateError) {
        console.error('❌ Failed to update job status:', updateError);
        throw new Error(`Failed to update job status: ${updateError.message}`);
      }
      
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
      try {
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
        
      } catch (storageError) {
        console.error('❌ Failed to store results:', storageError);
        throw new Error(`Failed to store results: ${storageError.message}`);
      }
      
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

module.exports = { jobCreatedFunction };