// Vercel-compatible Inngest webhook using CommonJS
const { serve } = require('inngest/express');

// Import functions using dynamic import for ES modules
let inngest, jobCreated, quotaExceeded, subscriptionUpdated, apifyRunCompleted, apifyRunFailed, apifyRunStart;

async function loadFunctions() {
  if (!inngest) {
    const functions = await import('../src/inngest/functions.js');
    inngest = functions.inngest;
    jobCreated = functions.jobCreated;
    quotaExceeded = functions.quotaExceeded;
    subscriptionUpdated = functions.subscriptionUpdated;
    apifyRunCompleted = functions.apifyRunCompleted;
    apifyRunFailed = functions.apifyRunFailed;
    apifyRunStart = functions.apifyRunStart;
  }
  return { inngest, jobCreated, quotaExceeded, subscriptionUpdated, apifyRunCompleted, apifyRunFailed, apifyRunStart };
}

// Create serve handler
async function createServeHandler() {
  const functions = await loadFunctions();
  return serve({
    client: functions.inngest,
    functions: [
      functions.jobCreated,
      functions.quotaExceeded,
      functions.subscriptionUpdated,
      functions.apifyRunCompleted,
      functions.apifyRunFailed,
      functions.apifyRunStart
    ]
  });
}

// Export handlers
module.exports = async (req, res) => {
  try {
    const handler = await createServeHandler();
    return await handler(req, res);
  } catch (error) {
    console.error('Inngest handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};