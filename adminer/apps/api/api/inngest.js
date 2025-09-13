// FIXED INNGEST WEBHOOK ENDPOINT - Vercel-compatible
const { serve } = require('inngest/express');

// Import functions using dynamic import for ES modules
let inngest, testFunction;

async function loadFunctions() {
  if (!inngest) {
    const functions = await import('../src/inngest/functions.js');
    inngest = functions.inngest;
    testFunction = functions.testFunction;
  }
  return { inngest, testFunction };
}

// Create serve handler with proper configuration
async function createServeHandler() {
  const functions = await loadFunctions();
  return serve({
    client: functions.inngest,
    functions: [
      functions.testFunction
    ],
    logLevel: 'info'
  });
}

// Export handlers with comprehensive error handling
module.exports = async (req, res) => {
  try {
    // Handle GET requests for debugging
    if (req.method === 'GET') {
      return res.json({
        status: 'active',
        functions: 1, // Updated
        endpoint: '/api/inngest',
        timestamp: new Date().toISOString(),
        environment: {
          hasEventKey: !!process.env.INNGEST_EVENT_KEY,
          hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
          nodeEnv: process.env.NODE_ENV
        }
      });
    }
    
    // Handle POST/PUT requests with Inngest
    const handler = await createServeHandler();
    return await handler(req, res);
  } catch (error) {
    console.error('Inngest handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};