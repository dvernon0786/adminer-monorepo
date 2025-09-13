// FIXED INNGEST FUNCTION - Safe undefined access
const { inngest } = require("./client.js");
const { neon } = require("@neondatabase/serverless");

const database = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

const jobCreatedFunction = inngest.createFunction(
  { id: "job-created" },
  { event: "job.created" },
  async ({ event }) => {
    const { jobId, keyword, orgId } = event.data || {}; // Safe destructuring
    
    console.log(`Processing job: ${jobId} for org: ${orgId}`);
    
    if (!database) {
      console.log("Database not available, job processed locally only");
      return { success: true, jobId, orgId, note: "database unavailable" };
    }
    
    try {
      // Find or create organization - SAFE ACCESS
      const existingOrg = await database.query(
        "SELECT id, clerk_org_id, quota_used, quota_limit FROM organizations WHERE clerk_org_id = $1",
        [orgId]
      );
      
      let organization;
      // FIXED: Safe array access
      if (existingOrg && existingOrg.rows && existingOrg.rows.length > 0) {
        organization = existingOrg.rows[0];
        console.log("Found existing organization:", organization.clerk_org_id);
      } else {
        // Create new organization
        console.log(`Creating new organization: ${orgId}`);
        const newOrg = await database.query(
          "INSERT INTO organizations (id, clerk_org_id, name, quota_used, quota_limit, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, 0, 100, NOW(), NOW()) RETURNING id, clerk_org_id, quota_used, quota_limit",
          [orgId, `Organization ${orgId}`]
        );
        // FIXED: Safe array access
        if (newOrg && newOrg.rows && newOrg.rows.length > 0) {
          organization = newOrg.rows[0];
          console.log("Created new organization:", organization.clerk_org_id);
        } else {
          throw new Error("Failed to create organization");
        }
      }

      // FIXED: Safe property access
      if (!organization || !organization.id) {
        throw new Error("Organization object is invalid");
      }

      // Create job - SAFE ACCESS
      const jobResult = await database.query(
        "INSERT INTO jobs (id, org_id, keyword, status, input, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id",
        [jobId, orgId, keyword, 'created', JSON.stringify({ limit: 1 })]
      );
      
      // FIXED: Safe result access
      if (jobResult && jobResult.rows && jobResult.rows.length > 0) {
        console.log("Job created successfully:", jobResult.rows[0].id);
      }

      // Update quota - SAFE ACCESS
      const quotaResult = await database.query(
        "UPDATE organizations SET quota_used = quota_used + 1, updated_at = NOW() WHERE clerk_org_id = $1 RETURNING quota_used, quota_limit",
        [orgId]
      );
      
      // FIXED: Safe result access
      let quotaInfo = { quota_used: 0, quota_limit: 100 }; // defaults
      if (quotaResult && quotaResult.rows && quotaResult.rows.length > 0) {
        quotaInfo = quotaResult.rows[0];
      }

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
      throw error;
    }
  }
);

module.exports = { jobCreatedFunction };