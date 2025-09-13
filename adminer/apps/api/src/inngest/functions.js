import { inngest } from './client.js';
import { neon } from '@neondatabase/serverless';
import { ApifyService } from '../lib/apify.js';

// Real database connection for Inngest functions
const database = neon(process.env.DATABASE_URL);

// Job Created Handler
const jobCreated = inngest.createFunction(
  { id: 'job-created' },
  { event: 'job.created' },
  async ({ event, step }) => {
    const { jobId, keyword, limit, orgId, timestamp, metadata } = event.data;
    
    console.log('🚀 Processing job.created event:', { jobId, keyword, orgId });
    
    // Step 1: Find or create organization dynamically
    const organization = await step.run('find-or-create-organization', async () => {
      console.log(`Looking up organization: ${orgId}`);
      
      // First, try to find existing organization
      const existingOrg = await database.query(
        "SELECT id, clerk_org_id, quota_used, quota_limit FROM organizations WHERE clerk_org_id = $1",
        [orgId]
      );
      
      if (existingOrg.rows && existingOrg.rows.length > 0) {
        console.log("Found existing organization:", existingOrg.rows[0]);
        return existingOrg.rows[0];
      }
      
      // If organization doesn't exist, create it dynamically
      console.log(`Creating new organization: ${orgId}`);
      const newOrg = await database.query(
        `INSERT INTO organizations (id, clerk_org_id, name, quota_used, quota_limit, created_at, updated_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) 
         RETURNING id, clerk_org_id, quota_used, quota_limit`,
        [
          orgId,
          `Organization ${orgId}`, // Dynamic name based on orgId
          0, // Initial quota_used
          100 // Default quota_limit (could be configurable)
        ]
      );
      
      console.log("Created new organization:", newOrg.rows[0]);
      return newOrg.rows[0];
    });

    // Step 2: Check quota
    if (organization.quota_used >= organization.quota_limit) {
      throw new Error(`Quota exceeded for organization: ${orgId} (${organization.quota_used}/${organization.quota_limit})`);
    }

    // Step 3: Create job in database
    const jobResult = await step.run('create-job', async () => {
      console.log(`Creating job in database: ${jobId}`);
      
      const result = await database.query(
        "INSERT INTO jobs (id, org_id, keyword, status, input, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id",
        [
          jobId,
          organization.id,
          keyword,
          'pending',
          JSON.stringify({ limit: parseInt(limit) })
        ]
      );
      
      console.log("Job creation result:", result);
      return result.rows;
    });
    
    // Update job status to running
    await step.run('update-job-status', async () => {
      const jobResult = await database.query(
        "UPDATE jobs SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *",
        ['running', new Date().toISOString(), jobId]
      );
      
      console.log('✅ Job status updated to running:', jobResult.rows[0]);
      return jobResult.rows[0];
    });
    
    // Step 4: Consume quota
    const quotaResult = await step.run('consume-quota', async () => {
      console.log(`Consuming quota for org: ${orgId}`);
      
      const result = await database.query(
        "UPDATE organizations SET quota_used = quota_used + 1, updated_at = NOW() WHERE clerk_org_id = $1 RETURNING quota_used, quota_limit",
        [orgId]
      );
      
      console.log("Quota consumption result:", result);
      return result.rows;
    });

    // Step 5: Update job status
    await step.run('update-job-status', async () => {
      console.log(`Updating job status: ${jobId}`);
      
      const result = await database.query(
        "UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status",
        ['created', jobId]
      );
      
      console.log("Job status update result:", result);
      return result.rows;
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
      console.log('Updating org quota for:', event.data);
      return { quotaUpdated: true };
    });

    await step.run('send-confirmation', async () => {
      console.log('Sending confirmation for:', event.data);
      return { confirmationSent: true };
    });

    return { message: 'Subscription updated successfully' };
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

    await step.run('update-job-status', async () => {
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
    await step.run('update-job-status', async () => {
      console.log('Updating job status for failed run:', event.data);
      return { statusUpdated: 'failed' };
    });

    return { message: 'Apify run failure handled' };
  }
);

// Apify Run Start Handler
const apifyService = new ApifyService();

const apifyRunStart = inngest.createFunction(
  { id: 'apify-run-start' },
  { event: 'apify.run.start' },
  async ({ event, step }) => {
    const { jobId, input, orgId } = event.data;
    
    await step.run('execute-apify-scrape', async () => {
      try {
        console.log('Starting Apify scrape for job:', jobId);
        const result = await apifyService.runScrapeJob({
          keyword: input.keyword,
          limit: input.limit || 10
        });
        
        console.log('Apify scrape completed:', result);
        
        // Update job with results
        await database.query(
          "UPDATE jobs SET status = $1, raw_data = $2, updated_at = $3 WHERE id = $4",
          ['completed', JSON.stringify(result), new Date().toISOString(), jobId]
        );
        
        // Trigger AI analysis
        await inngest.send({
          name: 'ai.analyze.start',
          data: { jobId, scraped_data: result, orgId }
        });
        
        return result;
      } catch (error) {
        console.error('Apify scrape failed:', error);
        await database.query(
          "UPDATE jobs SET status = $1, error = $2, updated_at = $3 WHERE id = $4",
          ['failed', error.message, new Date().toISOString(), jobId]
        );
        await inngest.send({
          name: 'apify.run.failed',
          data: { jobId, error: error.message, orgId }
        });
        throw error;
      }
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