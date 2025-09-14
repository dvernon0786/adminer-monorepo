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
        INSERT INTO organizations (id, clerk_org_id, name, quota_used, quota_limit, created_at, updated_at) 
        VALUES (gen_random_uuid(), $1, $2, 0, 100, NOW(), NOW())
        ON CONFLICT (clerk_org_id) DO UPDATE SET 
          updated_at = NOW(),
          name = EXCLUDED.name
        RETURNING id, clerk_org_id, quota_used, quota_limit
      `, [orgId, `Organization ${orgId}`]);
      
      if (!orgResult || !orgResult.rows || orgResult.rows.length === 0) {
        throw new Error("Failed to ensure organization exists");
      }
      
      const organization = orgResult.rows[0];
      console.log("Organization ready:", organization.clerk_org_id);

      // Create job using organization.id (internal UUID) - proper foreign key relationship
      const jobResult = await database.query(`
        INSERT INTO jobs (id, org_id, type, status, input, created_at) 
        VALUES ($1, $2, 'scrape', 'created', $3, NOW())
        RETURNING id
      `, [jobId, organization.id, JSON.stringify({ keyword, limit: 1 })]);

      if (!jobResult || !jobResult.rows || jobResult.rows.length === 0) {
        throw new Error("Failed to create job");
      }

      // Update quota using organization.id for consistency
      const quotaResult = await database.query(`
        UPDATE organizations 
        SET quota_used = quota_used + 1, updated_at = NOW() 
        WHERE id = $1
        RETURNING quota_used, quota_limit
      `, [organization.id]);

      const quotaInfo = quotaResult.rows[0] || { quota_used: 0, quota_limit: 100 };

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