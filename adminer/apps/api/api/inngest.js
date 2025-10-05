// Inngest Webhook Handler
// Handles Inngest function discovery and webhook events

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Handle Inngest function discovery (PUT request)
    if (req.method === 'PUT') {
      console.log('Inngest function discovery request received');
      
      // Return function definitions for Inngest
      const functions = [
        {
          id: 'job-created',
          name: 'Job Created Handler',
          triggers: [{ event: 'job.created' }]
        },
        {
          id: 'ai-analyze',
          name: 'AI Analysis Handler', 
          triggers: [{ event: 'ai/analyze.start' }]
        }
      ];

      res.status(200).json({
        success: true,
        functions: functions,
        message: 'Inngest functions registered successfully'
      });
      return;
    }

    // Handle webhook events (POST request)
    if (req.method === 'POST') {
      console.log('Inngest webhook event received:', req.body);
      
      // Process the webhook event
      const { name, data } = req.body;
      
      if (name === 'job.created') {
        // Handle job creation event
        console.log('Processing job.created event:', data);
        res.status(200).json({ success: true, message: 'Job created event processed' });
        return;
      }
      
      if (name === 'ai/analyze.start') {
        // Handle AI analysis event
        console.log('Processing ai/analyze.start event:', data);
        res.status(200).json({ success: true, message: 'AI analysis event processed' });
        return;
      }
      
      // Unknown event
      res.status(400).json({ error: 'Unknown event type', event: name });
      return;
    }

    // Handle GET requests (health check)
    if (req.method === 'GET') {
      res.status(200).json({
        status: 'healthy',
        service: 'inngest-webhook',
        timestamp: new Date().toISOString(),
        message: 'Inngest webhook handler is running'
      });
      return;
    }

    // Method not allowed
    res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Inngest webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
