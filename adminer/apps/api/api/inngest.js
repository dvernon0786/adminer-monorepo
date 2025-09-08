// Proper Inngest endpoint that matches Inngest Cloud expectations
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Handle PUT request for Inngest sync
    if (req.method === 'PUT') {
      console.log('Inngest sync request received');
      
      // Return function definitions in the format Inngest Cloud expects
      const functions = [
        {
          id: 'job-created',
          name: 'Job Created Handler',
          triggers: [{ event: 'job/created' }],
          steps: ['update-job-status', 'process-job', 'complete-job', 'consume-quota']
        },
        {
          id: 'quota-exceeded',
          name: 'Quota Exceeded Handler',
          triggers: [{ event: 'quota/exceeded' }],
          steps: ['send-quota-notification', 'trigger-upgrade-flow']
        },
        {
          id: 'subscription-updated',
          name: 'Subscription Updated Handler',
          triggers: [{ event: 'subscription/updated' }],
          steps: ['update-org-quota', 'send-confirmation']
        },
        {
          id: 'apify-run-completed',
          name: 'Apify Run Completed Handler',
          triggers: [{ event: 'apify/run.completed' }],
          steps: ['get-dataset-items', 'update-job-status']
        },
        {
          id: 'apify-run-failed',
          name: 'Apify Run Failed Handler',
          triggers: [{ event: 'apify/run.failed' }],
          steps: ['update-job-status']
        }
      ];

      // Return the response in the format Inngest Cloud expects
      res.status(200).json({
        functions: functions,
        appId: 'adminer-jobs',
        appName: 'Adminer Job Pipeline'
      });
      return;
    }

    // Handle GET request for health check
    if (req.method === 'GET') {
      res.status(200).json({
        success: true,
        message: 'Inngest endpoint is healthy',
        appId: 'adminer-jobs',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle POST request for webhook events
    if (req.method === 'POST') {
      console.log('Inngest webhook event received:', req.body);
      
      res.status(200).json({
        success: true,
        message: 'Webhook event received',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Method not allowed
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Inngest endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
// Cache bust Mon Sep  8 10:13:42 AM AEST 2025
