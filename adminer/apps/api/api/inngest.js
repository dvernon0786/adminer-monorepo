// Inngest endpoint for Vercel serverless functions
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
        { id: 'job-created', name: 'Job Created Handler', triggers: [{ event: 'job/created' }], steps: ['update-job-status', 'process-job', 'complete-job', 'consume-quota'] },
        { id: 'quota-exceeded', name: 'Quota Exceeded Handler', triggers: [{ event: 'quota/exceeded' }], steps: ['send-quota-notification', 'trigger-upgrade-flow'] },
        { id: 'subscription-updated', name: 'Subscription Updated Handler', triggers: [{ event: 'subscription/updated' }], steps: ['update-org-quota', 'send-confirmation'] },
        { id: 'apify-run-completed', name: 'Apify Run Completed Handler', triggers: [{ event: 'apify/run.completed' }], steps: ['get-dataset-items', 'update-job-status'] },
        { id: 'apify-run-failed', name: 'Apify Run Failed Handler', triggers: [{ event: 'apify/run.failed' }], steps: ['update-job-status'] }
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
        functions: [],
        appId: 'adminer-jobs',
        appName: 'Adminer Job Pipeline'
      });
      return;
    }

    // Handle POST request for events
    if (req.method === 'POST') {
      console.log('Inngest event received:', req.body);
      res.status(200).json({ success: true });
      return;
    }

    // Method not allowed
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Inngest endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}