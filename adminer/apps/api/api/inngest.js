// Inngest webhook endpoint - handles Inngest sync and events
module.exports = async (req, res) => {
  // Set CORS headers for Inngest
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Handle Inngest sync request (PUT method)
    if (req.method === 'PUT') {
      // Return function definitions for Inngest sync
      const functions = [
        {
          id: 'job-created',
          name: 'Job Created Handler',
          triggers: [{ event: 'job.created' }],
          steps: ['create-job-record', 'update-job-status', 'consume-quota', 'start-apify-job']
        },
        {
          id: 'quota-exceeded',
          name: 'Quota Exceeded Handler',
          triggers: [{ event: 'quota.exceeded' }],
          steps: ['send-quota-notification', 'trigger-upgrade-flow']
        },
        {
          id: 'subscription-updated',
          name: 'Subscription Updated Handler',
          triggers: [{ event: 'subscription.updated' }],
          steps: ['update-org-quota', 'send-confirmation']
        },
        {
          id: 'apify-run-start',
          name: 'Apify Run Start Handler',
          triggers: [{ event: 'apify.run.start' }],
          steps: ['execute-apify-scrape']
        },
        {
          id: 'apify-run-completed',
          name: 'Apify Run Completed Handler',
          triggers: [{ event: 'apify.run.completed' }],
          steps: ['get-dataset-items', 'update-job-status']
        },
        {
          id: 'apify-run-failed',
          name: 'Apify Run Failed Handler',
          triggers: [{ event: 'apify.run.failed' }],
          steps: ['update-job-status']
        }
      ];

      return res.status(200).json({
        functions,
        appId: 'adminer-jobs',
        appName: 'Adminer Job Pipeline',
        timestamp: new Date().toISOString()
      });
    }

    // Handle Inngest webhook events (POST method)
    if (req.method === 'POST') {
      console.log('Inngest webhook event received:', req.body);
      return res.status(200).json({
        success: true,
        message: 'Webhook event processed',
        timestamp: new Date().toISOString()
      });
    }

    // Handle health check (GET method)
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Inngest endpoint ready',
        timestamp: new Date().toISOString(),
        status: 'active',
        endpoint: '/api/inngest'
      });
    }

    // Method not allowed
    return res.status(405).json({
      error: 'Method not allowed',
      allowed: ['GET', 'POST', 'PUT'],
      received: req.method
    });

  } catch (error) {
    console.error('Inngest webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Inngest webhook failed',
      message: error.message
    });
  }
};