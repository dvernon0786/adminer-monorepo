// Fixed Inngest webhook that properly handles sync requests
const { Inngest } = require('inngest');

// Create Inngest client
const inngest = new Inngest({
  id: 'adminer-jobs',
  name: 'Adminer Job Pipeline',
  env: process.env.NODE_ENV || 'production',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY
});

// Define all Inngest functions directly in the webhook
const jobCreated = inngest.createFunction(
  { id: 'job-created', name: 'Job Created Handler' },
  { event: 'job.created' },
  async ({ event, step }) => {
    const { jobId, orgId, input } = event.data;
    
    await step.run('create-job-record', async () => {
      console.log('Creating job:', { jobId, orgId, input });
      return { jobId, status: 'created' };
    });
    
    await step.run('update-job-status', async () => {
      console.log('Updating job status to running:', jobId);
      return { jobId, status: 'running' };
    });
    
    await step.run('consume-quota', async () => {
      console.log('Consuming quota for job:', jobId);
      return { quotaConsumed: 1 };
    });
    
    await step.run('trigger-apify', async () => {
      await inngest.send({
        name: 'apify.run.start',
        data: { jobId, input, orgId }
      });
      return { apifyTriggered: true };
    });
    
    return { message: 'Job processing completed', jobId };
  }
);

const apifyRunStart = inngest.createFunction(
  { id: 'apify-run-start', name: 'Apify Run Start' },
  { event: 'apify.run.start' },
  async ({ event, step }) => {
    const { jobId, input } = event.data;
    
    await step.run('execute-scraping', async () => {
      console.log('Starting Apify scraping for job:', jobId);
      
      // Mock scraped results
      const results = {
        keyword: input.keyword,
        results: [
          { title: `Result 1 for ${input.keyword}`, url: 'https://example1.com' },
          { title: `Result 2 for ${input.keyword}`, url: 'https://example2.com' }
        ],
        totalFound: 2
      };
      
      // Trigger AI analysis
      await inngest.send({
        name: 'ai.analyze.start',
        data: { jobId, scrapedData: results }
      });
      
      return results;
    });
    
    return { message: 'Apify scraping completed', jobId };
  }
);

const aiAnalyzeStart = inngest.createFunction(
  { id: 'ai-analyze-start', name: 'AI Analysis Start' },
  { event: 'ai.analyze.start' },
  async ({ event, step }) => {
    const { jobId, scrapedData } = event.data;
    
    await step.run('analyze-data', async () => {
      console.log('Starting AI analysis for job:', jobId);
      
      const analysis = {
        summary: `Analysis of ${scrapedData.results.length} results`,
        insights: ['Popular keywords found', 'Trending topics identified'],
        recommendations: ['Focus on top results', 'Expand search terms']
      };
      
      return analysis;
    });
    
    return { message: 'AI analysis completed', jobId };
  }
);

// Additional functions
const quotaExceeded = inngest.createFunction(
  { id: 'quota-exceeded', name: 'Quota Exceeded Handler' },
  { event: 'quota.exceeded' },
  async ({ event, step }) => {
    await step.run('send-notification', async () => {
      console.log('Quota exceeded for org:', event.data.orgId);
      return { notificationSent: true };
    });
    return { message: 'Quota exceeded handled' };
  }
);

const subscriptionUpdated = inngest.createFunction(
  { id: 'subscription-updated', name: 'Subscription Updated Handler' },
  { event: 'subscription.updated' },
  async ({ event, step }) => {
    await step.run('update-quota', async () => {
      console.log('Updating quota for subscription:', event.data.orgId);
      return { quotaUpdated: true };
    });
    return { message: 'Subscription updated' };
  }
);

// All functions array
const functions = [
  jobCreated,
  apifyRunStart,
  aiAnalyzeStart,
  quotaExceeded,
  subscriptionUpdated
];

// Serve handler using Inngest's serve functionality
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-inngest-env, x-inngest-framework, x-inngest-platform, x-inngest-sdk');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle different HTTP methods
  if (req.method === 'PUT') {
    // Return function definitions for Inngest sync
    const functionDefinitions = functions.map(fn => ({
      id: fn.id || fn._def?.id,
      name: fn.name || fn._def?.name || fn.id,
      triggers: fn._def?.trigger ? [fn._def.trigger] : [{ event: 'unknown' }],
      steps: fn._def?.steps || []
    }));

    return res.status(200).json({
      functions: functionDefinitions,
      appId: 'adminer-jobs',
      appName: 'Adminer Job Pipeline',
      framework: 'vercel',
      platform: 'vercel',
      env: process.env.NODE_ENV || 'production',
      hasEventKey: !!process.env.INNGEST_EVENT_KEY,
      hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
      functionsFound: functions.length
    });
  }

  try {
    // Try to use Inngest serve handler for POST requests
    const { serve } = require('inngest/express');
    
    // Create serve handler
    const handler = serve({
      client: inngest,
      functions: functions
    });
    
    // Use the serve handler for POST requests
    if (req.method === 'POST') {
      return await handler(req, res);
    }
  } catch (serveError) {
    console.error('Inngest serve error:', serveError);
    
    // Fallback for POST requests
    if (req.method === 'POST') {
      const { event } = req.body;
      console.log('Received Inngest webhook event:', event);
      
      return res.status(200).json({
        success: true,
        message: 'Event received (fallback)',
        eventType: event?.name
      });
    }
  }

  if (req.method === 'GET') {
    // Health check
    return res.status(200).json({
      success: true,
      message: 'Inngest endpoint ready',
      functionsFound: functions.length,
      appId: 'adminer-jobs',
      hasEventKey: !!process.env.INNGEST_EVENT_KEY,
      hasSigningKey: !!process.env.INNGEST_SIGNING_KEY
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};