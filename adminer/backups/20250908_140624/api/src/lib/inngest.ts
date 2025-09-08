import { Inngest } from 'inngest';
import { jobDb, orgDb, db } from './db';
import { apifyService, ScrapeInput } from './apify';
import { jobs } from '../db/schema';
import { eq } from 'drizzle-orm';

// Initialize Inngest client
export const inngest = new Inngest({ 
  id: 'adminer-jobs',
  name: 'Adminer Job Pipeline'
});

// Job types
export type JobType = 'scrape' | 'analyze' | 'export';

// Job events
export const jobEvents = {
  jobCreated: inngest.createFunction(
    { id: 'job-created' },
    { event: 'job/created' },
    async ({ event, step }) => {
      const { jobId, orgId, type, input } = event.data;
      
      console.log('Processing job created:', { jobId, orgId, type });
      
      // Update job status to running
      await step.run('update-job-status', async () => {
        return await jobDb.updateStatus(jobId, 'running');
      });
      
      // Process job based on type
      let result;
      switch (type) {
        case 'scrape':
          result = await step.run('scrape-job', async () => {
            return await processScrapeJob(input);
          });
          break;
        case 'analyze':
          result = await step.run('analyze-job', async () => {
            return await processAnalyzeJob(input);
          });
          break;
        case 'export':
          result = await step.run('export-job', async () => {
            return await processExportJob(input);
          });
          break;
        default:
          throw new Error(`Unknown job type: ${type}`);
      }
      
      // Update job with results
      await step.run('complete-job', async () => {
        return await jobDb.updateStatus(jobId, 'completed', result);
      });
      
      // Consume quota
      await step.run('consume-quota', async () => {
        const quotaAmount = getQuotaAmount(type, input);
        return await orgDb.consumeQuota(orgId, quotaAmount, type, `Job ${jobId}`);
      });
      
      return { success: true, jobId, result };
    }
  ),
  
  quotaExceeded: inngest.createFunction(
    { id: 'quota-exceeded' },
    { event: 'quota/exceeded' },
    async ({ event, step }) => {
      const { orgId, currentUsage, limit } = event.data;
      
      console.log('Handling quota exceeded:', { orgId, currentUsage, limit });
      
      // Send notification to organization
      await step.run('send-quota-notification', async () => {
        // In a real implementation, this would send an email or in-app notification
        console.log(`Quota exceeded for org ${orgId}: ${currentUsage}/${limit}`);
        return { notificationSent: true };
      });
      
      // Trigger upgrade flow
      await step.run('trigger-upgrade-flow', async () => {
        // This could trigger an email campaign or in-app upgrade prompt
        console.log(`Triggering upgrade flow for org ${orgId}`);
        return { upgradeFlowTriggered: true };
      });
      
      return { success: true, orgId };
    }
  ),
  
  subscriptionUpdated: inngest.createFunction(
    { id: 'subscription-updated' },
    { event: 'subscription/updated' },
    async ({ event, step }) => {
      const { orgId, plan, quotaLimit } = event.data;
      
      console.log('Processing subscription update:', { orgId, plan, quotaLimit });
      
      // Update organization quota
      await step.run('update-org-quota', async () => {
        return await orgDb.update(orgId, {
          plan,
          quotaLimit,
          quotaUsed: 0 // Reset quota on plan change
        });
      });
      
      // Send confirmation
      await step.run('send-confirmation', async () => {
        console.log(`Subscription updated for org ${orgId}: ${plan} plan with ${quotaLimit} quota`);
        return { confirmationSent: true };
      });
      
      return { success: true, orgId, plan, quotaLimit };
    }
  ),

  // New Apify webhook event handlers
  apifyRunCompleted: inngest.createFunction(
    { id: 'apify-run-completed' },
    { event: 'apify/run.completed' },
    async ({ event, step }) => {
      const { runId, actorId, defaultDatasetId, stats } = event.data;
      
      console.log('Processing Apify run completion:', { runId, actorId, defaultDatasetId });
      
      // Get dataset items
      const datasetItems = await step.run('get-dataset-items', async () => {
        return await apifyService.getRunResults(runId, 100);
      });
      
      // Update job status if we can find the associated job
      await step.run('update-job-status', async () => {
        const runningJobs = await jobDb.findByStatus('running');
        for (const job of runningJobs) {
          if ((job.input as any)?.runId === runId) {
            return await jobDb.updateStatus(job.id, 'completed', {
              runId,
              defaultDatasetId,
              stats,
              data: datasetItems,
              completedAt: new Date().toISOString()
            });
          }
        }
        return { jobUpdated: false };
      });
      
      return { success: true, runId, dataCount: datasetItems.length };
    }
  ),

  apifyRunFailed: inngest.createFunction(
    { id: 'apify-run-failed' },
    { event: 'apify/run.failed' },
    async ({ event, step }) => {
      const { runId, actorId, errorMessage, stats } = event.data;
      
      console.log('Processing Apify run failure:', { runId, actorId, errorMessage });
      
      // Update job status
      await step.run('update-job-status', async () => {
        const runningJobs = await jobDb.findByStatus('running');
        for (const job of runningJobs) {
          if ((job.input as any)?.runId === runId) {
            return await jobDb.updateStatus(job.id, 'failed', {
              runId,
              error: errorMessage,
              stats,
              failedAt: new Date().toISOString()
            });
          }
        }
        return { jobUpdated: false };
      });
      
      return { success: true, runId, error: errorMessage };
    }
  )
};

// Job processing functions
async function processScrapeJob(input: any) {
  console.log('Processing scrape job with real Apify integration:', input);
  
  // Extract jobId from input
  const { jobId } = input;
  
  try {
    // Validate input
    if (!input.keyword || !input.limit) {
      throw new Error('Missing required fields: keyword, limit');
    }

    // Prepare Apify input
    const scrapeInput: ScrapeInput = {
      keyword: input.keyword,
      limit: Math.min(input.limit, 100), // Cap at 100 results
      country: input.country || 'US',
      language: input.language || 'en'
    };

    console.log('Starting Apify scrape with input:', scrapeInput);

    // Run Apify scraping job
    const result = await apifyService.runScrapeJob(scrapeInput);

    console.log('Apify scrape completed:', {
      status: result.status,
      dataExtracted: result.dataExtracted,
      processingTime: result.processingTime
    });

    // Store raw data in database if successful
    if (result.status === 'completed' && result.data.length > 0) {
      console.log('Storing scraped data:', result.data.length, 'items');
      
      try {
        // Store raw data in Neon database
        await db.update(jobs)
          .set({
            status: 'completed',
            output: {
              runId: result.runId || 'unknown',
              defaultDatasetId: result.defaultDatasetId || 'unknown',
              stats: {
                totalItems: result.data.length,
                processingTime: result.processingTime || 0,
                pagesScraped: result.pagesScraped || 1,
                dataExtracted: result.dataExtracted || result.data.length
              },
              data: result.data, // Raw Apify dataset items stored here
              completedAt: new Date().toISOString()
            },
            completedAt: new Date()
          })
          .where(eq(jobs.id, jobId));
          
        console.log('Raw Apify data stored in database for job:', jobId);
      } catch (dbError) {
        console.error('Database storage error:', dbError);
        
        // Fallback: mark job as completed with error
        await db.update(jobs)
          .set({
            status: 'completed',
            error: 'Data retrieved but storage failed: ' + dbError.message,
            completedAt: new Date()
          })
          .where(eq(jobs.id, jobId));
      }
    }

    return result;

  } catch (error) {
    console.error('Scrape job failed:', error);
    
    return {
      type: 'scrape',
      keyword: input.keyword || 'unknown',
      limit: input.limit || 0,
      pagesScraped: 0,
      dataExtracted: 0,
      processingTime: 0,
      status: 'failed',
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function processAnalyzeJob(input: any) {
  console.log('Processing analyze job:', input);
  
  // Simulate analysis work
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // In a real implementation, this would:
  // 1. Use GPT-4o or Gemini to analyze the data
  // 2. Generate insights and summaries
  // 3. Store analysis results
  
  return {
    type: 'analyze',
    dataSize: input.dataSize || 1000,
    insights: Math.floor(Math.random() * 50) + 10,
    confidence: Math.random() * 0.3 + 0.7, // 70-100%
    processingTime: 3000,
    status: 'completed'
  };
}

async function processExportJob(input: any) {
  console.log('Processing export job:', input);
  
  // Simulate export work
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In a real implementation, this would:
  // 1. Format data according to export type
  // 2. Generate file (CSV, JSON, etc.)
  // 3. Upload to storage and provide download link
  
  return {
    type: 'export',
    format: input.format || 'csv',
    recordsExported: input.recordCount || 1000,
    fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
    downloadUrl: `https://adminer.online/downloads/export-${Date.now()}.${input.format || 'csv'}`,
    processingTime: 1500,
    status: 'completed'
  };
}

// Helper function to determine quota consumption
function getQuotaAmount(type: JobType, input: any): number {
  switch (type) {
    case 'scrape':
      return Math.ceil((input.pages || 1) / 10); // 1 quota per 10 pages
    case 'analyze':
      return Math.ceil((input.dataSize || 1000) / 1000); // 1 quota per 1KB
    case 'export':
      return Math.ceil((input.recordCount || 1000) / 1000); // 1 quota per 1K records
    default:
      return 1;
  }
}

// Export job creation helper
export async function createJob(orgId: string, type: JobType, input: any) {
  // Create job in database
  const job = await jobDb.create({ orgId, type, input });
  
  // Trigger Inngest event
  await inngest.send({
    name: 'job/created',
    data: {
      jobId: job.id,
      orgId,
      type,
      input
    }
  });
  
  return job;
}

// Export quota check helper
export async function checkQuota(orgId: string, requiredAmount: number) {
  const quotaStatus = await orgDb.getQuotaStatus(orgId);
  
  if (!quotaStatus) {
    throw new Error('Organization not found');
  }
  
  if (quotaStatus.used + requiredAmount > quotaStatus.limit) {
    // Trigger quota exceeded event
    await inngest.send({
      name: 'quota/exceeded',
      data: {
        orgId,
        currentUsage: quotaStatus.used,
        limit: quotaStatus.limit,
        requiredAmount
      }
    });
    
    throw new Error('Quota limit exceeded');
  }
  
  return quotaStatus;
}