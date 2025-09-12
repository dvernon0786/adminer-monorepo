// Inngest webhook endpoint - handles Inngest sync and events
const { Inngest } = require('inngest');

// Create Inngest client
const inngest = new Inngest({
  id: 'adminer-jobs',
  name: 'Adminer Job Pipeline',
  env: process.env.NODE_ENV || 'production',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  baseUrl: process.env.INNGEST_BASE_URL || 'https://api.inngest.com'
});

// Define Inngest functions
const jobCreated = inngest.createFunction(
  { id: 'job-created' },
  { event: 'job.created' },
  async ({ event, step }) => {
    console.log('Job created event received:', event.data);
    return { message: 'Job created and processing started' };
  }
);

const quotaExceeded = inngest.createFunction(
  { id: 'quota-exceeded' },
  { event: 'quota.exceeded' },
  async ({ event, step }) => {
    console.log('Quota exceeded event received:', event.data);
    return { message: 'Quota exceeded handling completed' };
  }
);

const subscriptionUpdated = inngest.createFunction(
  { id: 'subscription-updated' },
  { event: 'subscription.updated' },
  async ({ event, step }) => {
    console.log('Subscription updated event received:', event.data);
    return { message: 'Subscription updated successfully' };
  }
);

const apifyRunStart = inngest.createFunction(
  { id: 'apify-run-start' },
  { event: 'apify.run.start' },
  async ({ event, step }) => {
    console.log('Apify run start event received:', event.data);
    return { message: 'Apify scraping started' };
  }
);

const apifyRunCompleted = inngest.createFunction(
  { id: 'apify-run-completed' },
  { event: 'apify.run.completed' },
  async ({ event, step }) => {
    console.log('Apify run completed event received:', event.data);
    return { message: 'Apify run completed successfully' };
  }
);

const apifyRunFailed = inngest.createFunction(
  { id: 'apify-run-failed' },
  { event: 'apify.run.failed' },
  async ({ event, step }) => {
    console.log('Apify run failed event received:', event.data);
    return { message: 'Apify run failure handled' };
  }
);

// Create serve handler
const { serve } = require('inngest/express');

const inngestHandler = serve({
  client: inngest,
  functions: [
    jobCreated,
    quotaExceeded,
    subscriptionUpdated,
    apifyRunStart,
    apifyRunCompleted,
    apifyRunFailed
  ]
});

module.exports = async (req, res) => {
  // Set CORS headers for Inngest
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Use Inngest serve handler for proper function registration
    return await inngestHandler(req, res);
  } catch (error) {
    console.error('Inngest webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Inngest webhook failed',
      message: error.message
    });
  }
};