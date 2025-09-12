// Inngest webhook endpoint - handles Inngest sync and events
const { inngest, serve } = require('../src/inngest/client');

// Import all Inngest functions
const {
  jobCreated,
  quotaExceeded,
  subscriptionUpdated,
  apifyRunStart,
  apifyRunCompleted,
  apifyRunFailed
} = require('../src/inngest/functions');

// Create Inngest serve handler
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