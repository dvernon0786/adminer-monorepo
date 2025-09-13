// VERCEL COMPATIBLE INNGEST FUNCTION (CommonJS)
const { inngest } = require("./client.js");
const { neon } = require("@neondatabase/serverless");

const database = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

const jobCreatedFunction = inngest.createFunction(
  { id: "job-created" },
  { event: "job.created" },
  async ({ event }) => {
    const { jobId, keyword, orgId } = event.data;
    
    console.log(`Processing job: ${jobId} for org: ${orgId}`);
    
    if (!database) {
      console.log("Database not available, job processed locally only");
      return { success: true, jobId, orgId, note: "database unavailable" };
    }
    
    try {
      // Find or create organization
      const existingOrg = await database.query(
        "SELECT id, clerk_org_id, quota_used, quota_limit FROM organizations WHERE clerk_org_id = $1",
        [orgId]
      );
      
      let organization;
      if (existingOrg.rows && existingOrg.rows.length > 0) {
        organization = existingOrg.rows[0];
      } else {
        // Create new organization
        const newOrg = await database.query(
          "INSERT INTO organizations (id, clerk_org_id, name, quota_used, quota_limit, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, 0, 100, NOW(), NOW()) RETURNING id, clerk_org_id, quota_used, quota_limit",
          [orgId, `Organization ${orgId}`]
        );
        organization = newOrg.rows[0];
      }

      // Create job
      await database.query(
        "INSERT INTO jobs (id, org_id, keyword, status, input, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())",
        [jobId, orgId, keyword, 'created', JSON.stringify({ limit: 1 })]
      );

      // Update quota
      await database.query(
        "UPDATE organizations SET quota_used = quota_used + 1, updated_at = NOW() WHERE clerk_org_id = $1",
        [orgId]
      );

      console.log(`Job ${jobId} processed successfully`);
      return { success: true, jobId, orgId };

    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      throw error;
    }
  }
);

module.exports = { jobCreatedFunction };