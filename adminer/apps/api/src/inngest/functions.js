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
    
    // Create job in database
    await step.run('create-job-record', async () => {
      // First, get the organization ID from clerk_org_id
      const orgResult = await database`
        SELECT id FROM organizations 
        WHERE clerk_org_id = ${orgId} 
        LIMIT 1
      `;
      
      if (!orgResult || orgResult.length === 0) {
        throw new Error(`Organization not found for clerk_org_id: ${orgId}`);
      }
      
      const dbOrgId = orgResult[0].id;
      
      // Insert job into database
      const jobResult = await database`
        INSERT INTO jobs (id, org_id, keyword, status, type, input, created_at)
        VALUES (${jobId}, ${dbOrgId}, ${keyword || 'unknown'}, ${'pending'}, ${'scrape'}, ${JSON.stringify(metadata || {})}, ${timestamp || new Date().toISOString()})
        RETURNING *
      `;
      
      console.log('✅ Job created in database:', jobResult[0]);
      return jobResult[0];
    });
    
    // Update job status to running
    await step.run('update-job-status', async () => {
      const jobResult = await database`
        UPDATE jobs 
        SET status = ${'running'}, updated_at = ${new Date().toISOString()}
        WHERE id = ${jobId}
        RETURNING *
      `;
      
      console.log('✅ Job status updated to running:', jobResult[0]);
      return jobResult[0];
    });
    
    // Consume quota
    await step.run('consume-quota', async () => {
      try {
        // Get organization
        const orgResult = await database`
          SELECT id, quota_used, quota_limit FROM organizations 
          WHERE clerk_org_id = ${orgId} 
          LIMIT 1
        `;
        
        if (!orgResult || orgResult.length === 0) {
          throw new Error(`Organization not found for clerk_org_id: ${orgId}`);
        }
        
        const org = orgResult[0];
        const newQuotaUsed = (org.quota_used || 0) + 1;
        
        if (newQuotaUsed > org.quota_limit) {
          throw new Error(`Quota exceeded: ${newQuotaUsed}/${org.quota_limit}`);
        }
        
        // Update quota
        await database`
          UPDATE organizations 
          SET quota_used = ${newQuotaUsed}, updated_at = ${new Date().toISOString()}
          WHERE clerk_org_id = ${orgId}
        `;
        
        console.log('✅ Quota consumed:', { used: newQuotaUsed, limit: org.quota_limit });
        return { used: newQuotaUsed, limit: org.quota_limit };
      } catch (error) {
        console.error('❌ Quota exceeded:', error);
        // Quota exceeded - trigger quota exceeded event
        await inngest.send({
          name: 'quota.exceeded',
          data: { orgId, jobId, error: error.message }
        });
        throw error;
      }
    });
    
    // Trigger Apify scraping
    await step.run('start-apify-job', async () => {
      await inngest.send({
        name: 'apify.run.start',
        data: { jobId, input, orgId }
      });
      console.log('Apify job triggered for:', jobId);
      return { apifyTriggered: true };
    });
    
    return { message: 'Job created and processing started' };
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
        await database`
          UPDATE jobs 
          SET status = ${'completed'}, output = ${JSON.stringify(result)}, updated_at = ${new Date().toISOString()}
          WHERE id = ${jobId}
        `;
        
        // Trigger AI analysis
        await inngest.send({
          name: 'ai.analyze.start',
          data: { jobId, scraped_data: result, orgId }
        });
        
        return result;
      } catch (error) {
        console.error('Apify scrape failed:', error);
        await database`
          UPDATE jobs 
          SET status = ${'failed'}, error = ${error.message}, updated_at = ${new Date().toISOString()}
          WHERE id = ${jobId}
        `;
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