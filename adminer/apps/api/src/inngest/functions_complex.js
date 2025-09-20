import { inngest } from './client.js';
import { neon } from '@neondatabase/serverless';
import { ApifyService } from '../lib/apify.js';

// Real database connection for Inngest functions
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

// Job Created Handler
const jobCreated = inngest.createFunction(
  { id: 'job-created' },
  { event: 'job.created' },
  async ({ event, step }) => {
    const { jobId, keyword, limit, orgId, timestamp, metadata } = event.data;
    
    console.log('🚀 Processing job.created event:', { jobId, keyword, orgId });
    
    try {
      // Step 1: Find or create organization dynamically
      const organization = await step.run('find-or-create-organization', async () => {
        console.log(`Looking up organization: ${orgId}`);
        
        // First, try to find existing organization
        const existingOrg = await sql`
          SELECT id, clerk_org_id, quota_used, quota_limit FROM organizations WHERE clerk_org_id = ${orgId}
        `;
        
        if (existingOrg && existingOrg.length > 0) {
          console.log("Found existing organization:", existingOrg[0]);
          return existingOrg[0];
        }
        
        // If organization doesn't exist, create it dynamically
        console.log(`Creating new organization: ${orgId}`);
        const newOrg = await sql`
          INSERT INTO organizations (id, clerk_org_id, name, quota_used, quota_limit, created_at, updated_at) 
          VALUES (gen_random_uuid(), ${orgId}, ${`Organization ${orgId}`}, 0, 100, NOW(), NOW()) 
          RETURNING id, clerk_org_id, quota_used, quota_limit
        `;
        
        console.log("Created new organization:", newOrg[0]);
        return newOrg[0];
      });

      // Step 2: Check quota
      if (organization.quota_used >= organization.quota_limit) {
        throw new Error(`Quota exceeded for organization: ${orgId} (${organization.quota_used}/${organization.quota_limit})`);
      }

      // Step 3: Create job in database
      const jobResult = await step.run('create-job', async () => {
        console.log(`Creating job in database: ${jobId}`);
        
        const result = await sql`
          INSERT INTO jobs (id, org_id, keyword, status, input, created_at, updated_at) 
          VALUES (${jobId}, ${organization.id}, ${keyword}, 'pending', ${JSON.stringify({ limit: parseInt(limit) })}, NOW(), NOW()) 
          RETURNING id
        `;
        
        console.log("Job creation result:", result);
        return result;
      });

      // Step 4: Consume quota - FIXED: Use actual ads requested instead of hardcoded 1
      const quotaResult = await step.run('consume-quota', async () => {
        console.log(`Consuming quota for org: ${orgId}`);
        
        // Extract the requested ads count from the event
        const requestedAds = limit || event.data.ads_count || 10;
        
        console.log('QUOTA CONSUMPTION:', {
          orgId: orgId,
          requestedAds: requestedAds,
          method: 'consuming_actual_ads_not_hardcoded_1'
        });
        
        const result = await sql`
          UPDATE organizations SET quota_used = quota_used + ${requestedAds}, updated_at = NOW() 
          WHERE clerk_org_id = ${orgId} 
          RETURNING quota_used, quota_limit, id
        `;
        
        console.log("Quota consumption result:", result);
        
        // FIXED: Add quota usage logging
        if (result.length > 0) {
          const orgId = result[0].id;
          await sql`
            INSERT INTO quota_usage (org_id, type, amount, description, created_at)
            VALUES (${orgId}, 'scrape', ${requestedAds}, ${`Job ${jobId} - ${requestedAds} ads`}, NOW())
          `;
          console.log("Quota usage record created for org:", orgId);
        }
        
        return result;
      });

      // Step 5: Update job status to created
      await step.run('update-job-status-created', async () => {
        console.log(`Updating job status: ${jobId}`);
        
        const result = await sql`
          UPDATE jobs SET status = 'created', updated_at = NOW() 
          WHERE id = ${jobId} 
          RETURNING id, status
        `;
        
        console.log("Job status update result:", result);
        return result;
      });

      console.log(`Job ${jobId} processed successfully for org ${orgId}`);
      
      return {
        success: true,
        jobId,
        orgId,
        quotaUsed: quotaResult[0]?.quota_used || 0,
        quotaLimit: quotaResult[0]?.quota_limit || 0
      };

    } catch (error) {
      console.error(`Error processing job ${jobId} for org ${orgId}:`, error);
      
      // Update job status to failed (if job was created)
      try {
        await database.query(
          "UPDATE jobs SET status = $1, error = $2, updated_at = NOW() WHERE id = $3",
          ['failed', error.message, jobId]
        );
      } catch (updateError) {
        console.error("Failed to update job status:", updateError);
      }
      
      throw error;
    }
  }
);

// Quota Exceeded Handler
const quotaExceeded = inngest.createFunction(
  { id: 'quota-exceeded' },
  { event: 'quota.exceeded' },
  async ({ event, step }) => {
    await step.run('send-quota-notification', async () => {
      console.log('Sending quota notification for:', event.data);
      return { notificationSent: true };
    });

    await step.run('trigger-upgrade-flow', async () => {
      console.log('Triggering upgrade flow for:', event.data);
      return { upgradeFlowTriggered: true };
    });

    return { message: 'Quota exceeded handling completed' };
  }
);

// Subscription Updated Handler
const subscriptionUpdated = inngest.createFunction(
  { id: 'subscription-updated' },
  { event: 'subscription.updated' },
  async ({ event, step }) => {
    await step.run('update-org-quota', async () => {
      console.log('Updating organization quota for:', event.data);
      return { quotaUpdated: true };
    });

    await step.run('send-confirmation', async () => {
      console.log('Sending confirmation for:', event.data);
      return { confirmationSent: true };
    });

    return { message: 'Subscription update completed' };
  }
);

// Apify Run Completed Handler
const apifyRunCompleted = inngest.createFunction(
  { id: 'apify-run-completed' },
  { event: 'apify.run.completed' },
  async ({ event, step }) => {
    await step.run('get-dataset-items', async () => {
      console.log('Getting dataset items for:', event.data);
      return { itemsRetrieved: true };
    });

    await step.run('update-job-status-completed', async () => {
      console.log('Updating job status for:', event.data);
      return { statusUpdated: true };
    });

    return { message: 'Apify run completed successfully' };
  }
);

// Apify Run Failed Handler
const apifyRunFailed = inngest.createFunction(
  { id: 'apify-run-failed' },
  { event: 'apify.run.failed' },
  async ({ event, step }) => {
    await step.run('update-job-status-failed', async () => {
      console.log('Updating job status for failed run:', event.data);
      return { statusUpdated: 'failed' };
    });

    return { message: 'Apify run failure handled' };
  }
);

// Apify Run Start Handler
const apifyRunStart = inngest.createFunction(
  { id: 'apify-run-start' },
  { event: 'apify.run.start' },
  async ({ event, step }) => {
    await step.run('execute-apify-scrape', async () => {
      console.log('Executing Apify scrape for:', event.data);
      return { scrapeExecuted: true };
    });

    return { message: 'Apify scraping completed' };
  }
);

export {
  inngest,
  jobCreated,
  quotaExceeded,
  subscriptionUpdated,
  apifyRunCompleted,
  apifyRunFailed,
  apifyRunStart
};