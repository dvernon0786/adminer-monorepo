import { Inngest } from 'inngest';
import { jobDb, orgDb, webhookDb } from '../lib/db';
import { ApifyService } from '../lib/apify';

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: 'adminer-jobs',
  name: 'Adminer Job Pipeline'
});

// Job Created Handler
export const jobCreated = inngest.createFunction(
  { id: 'job-created' },
  { event: 'job/created' },
  async ({ event, step }) => {
    const { jobId, orgId, input, type } = event.data;
    
    // Create job in database
    await step.run('create-job-record', async () => {
      const job = await jobDb.create({
        orgId,
        type: type || 'scrape',
        input
      });
      console.log('Job created in database:', job);
      return job;
    });
    
    // Update job status to running
    await step.run('update-job-status', async () => {
      const job = await jobDb.updateStatus(jobId, 'running');
      console.log('Job status updated to running:', job);
      return job;
    });
    
    // Consume quota - FIXED: Use actual ads requested instead of hardcoded 1
    await step.run('consume-quota', async () => {
      try {
        // Extract the requested ads count from the input
        const requestedAds = input?.limit || input?.ads_count || 10;
        
        console.log('QUOTA CONSUMPTION:', {
          orgId: orgId,
          jobId: jobId,
          requestedAds: requestedAds,
          method: 'consuming_actual_ads_not_hardcoded_1'
        });
        
        const quota = await orgDb.consumeQuota(orgId, requestedAds, 'scrape', `Job ${jobId} - ${requestedAds} ads`);
        console.log('Quota consumed:', quota);
        return quota;
      } catch (error) {
        console.error('Quota exceeded:', error);
        // Quota exceeded - trigger quota exceeded event
        await inngest.send({
          name: 'quota/exceeded',
          data: { orgId, jobId, error: error.message }
        });
        throw error;
      }
    });
    
    // Trigger Apify scraping
    await step.run('start-apify-job', async () => {
      await inngest.send({
        name: 'apify/run.start',
        data: { jobId, input, orgId }
      });
      console.log('Apify job triggered for:', jobId);
      return { apifyTriggered: true };
    });
    
    return { message: 'Job created and processing started' };
  }
);

// Quota Exceeded Handler
export const quotaExceeded = inngest.createFunction(
  { id: 'quota-exceeded' },
  { event: 'quota/exceeded' },
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
export const subscriptionUpdated = inngest.createFunction(
  { id: 'subscription-updated' },
  { event: 'subscription/updated' },
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
export const apifyRunCompleted = inngest.createFunction(
  { id: 'apify-run-completed' },
  { event: 'apify/run.completed' },
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
export const apifyRunFailed = inngest.createFunction(
  { id: 'apify-run-failed' },
  { event: 'apify/run.failed' },
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

export const apifyRunStart = inngest.createFunction(
  { id: 'apify-run-start' },
  { event: 'apify/run.start' },
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
        await jobDb.updateStatus(jobId, 'completed', result);
        
        // Trigger AI analysis
        await inngest.send({
          name: 'ai/analyze.start',
          data: { jobId, scraped_data: result, orgId }
        });
        
        return result;
      } catch (error) {
        console.error('Apify scrape failed:', error);
        await jobDb.updateStatus(jobId, 'failed', null, error.message);
        await inngest.send({
          name: 'apify/run.failed',
          data: { jobId, error: error.message, orgId }
        });
        throw error;
      }
    });
    
    return { message: 'Apify scraping completed' };
  }
);