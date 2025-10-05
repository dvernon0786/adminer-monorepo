// FIXED INNGEST WEBHOOK ENDPOINT - Vercel-compatible
const { serve } = require('inngest/next');

// Import functions and client using require for CommonJS
let inngestClient, jobCreatedFunction, aiAnalyze;

async function loadFunctions() {
  if (!inngestClient) {
    try {
      console.log('Loading Inngest client and functions...');
      
      // Load client
      const { inngest } = require('../src/inngest/client.js');
      inngestClient = inngest;
      
      // Load functions
      const { jobCreatedFunction: jobFunc, aiAnalyze: aiFunc } = require('../src/inngest/functions.js');
      jobCreatedFunction = jobFunc;
      aiAnalyze = aiFunc;
      
      console.log('✅ Inngest client and functions loaded successfully');
    } catch (error) {
      console.error('❌ Error loading Inngest components:', error);
      throw error;
    }
  }
  return { inngestClient, jobCreatedFunction, aiAnalyze };
}

// Create serve handler with proper configuration
async function createServeHandler() {
  const { inngestClient, jobCreatedFunction, aiAnalyze } = await loadFunctions();
  
  return serve({
    client: inngestClient,
    functions: [
      jobCreatedFunction,
      aiAnalyze
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
        functions: 2,
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
