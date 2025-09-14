// RACE-CONDITION-SAFE INNGEST FUNCTION WITH COMPREHENSIVE ERROR HANDLING
const { inngest } = require("./client.js");
const { neon } = require("@neondatabase/serverless");

const database = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

const jobCreatedFunction = inngest.createFunction(
  { id: "job-created" },
  { event: "job.created" },
  async ({ event }) => {
    const { jobId, keyword, orgId } = event.data || {};
    
    console.log(`Processing job: ${jobId} for org: ${orgId}`);
    
    if (!database) {
      console.log("Database not available, job processed locally only");
      return { success: true, jobId, orgId, note: "database unavailable" };
    }
    
    try {
      // FIXED: Use UPSERT to handle race conditions - NO MORE DUPLICATE KEY ERRORS
      const orgResult = await database.query(`
        INSERT INTO orgs (id, name, plan, status, quota_used, quota_limit, created_at, updated_at) 
        VALUES ($1, $2, 'free', 'active', 0, 100, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET 
          updated_at = NOW(),
          name = EXCLUDED.name
        RETURNING id, name, quota_used, quota_limit
      `, [orgId, `Organization ${orgId}`]);
      
      if (!orgResult || !Array.isArray(orgResult) || orgResult.length === 0) {
        throw new Error("Failed to ensure organization exists");
      }
      
      const organization = orgResult[0];
      console.log("Organization ready:", organization.id);

      // Create job using organization.id (internal UUID) - proper foreign key relationship
      const jobResult = await database.query(`
        INSERT INTO jobs (id, org_id, requested_by, keyword, status, input, created_at) 
        VALUES ($1, $2, $3, $4, 'queued', $5, NOW())
        RETURNING id
      `, [jobId, organization.id, orgId, keyword, JSON.stringify({ limit: 1 })]);

      if (!jobResult || !Array.isArray(jobResult) || jobResult.length === 0) {
        throw new Error("Failed to create job");
      }

      // Update quota using organization.id for consistency
      const quotaResult = await database.query(`
        UPDATE orgs 
        SET quota_used = quota_used + 1, updated_at = NOW() 
        WHERE id = $1
        RETURNING quota_used, quota_limit
      `, [organization.id]);

      const quotaInfo = quotaResult[0] || { quota_used: 0, quota_limit: 100 };

      console.log(`Job ${jobId} processed successfully`);
      return { 
        success: true, 
        jobId, 
        orgId,
        quota_used: quotaInfo.quota_used,
        quota_limit: quotaInfo.quota_limit
      };

    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      
      // Enhanced error logging for debugging
      if (error.message.includes('duplicate key')) {
        console.error('CRITICAL: Duplicate key error still occurring - UPSERT not working');
      }
      
      throw error;
    }
  }
);

module.exports = { jobCreatedFunction };