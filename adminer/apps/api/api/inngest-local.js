// LOCAL INNGEST SERVE HANDLER - For Inngest Dev Server Discovery
const { serve } = require('inngest/express');
const { inngest } = require('../src/inngest/client.js');
const { jobCreatedFunction } = require('../src/inngest/functions.js');

// Create serve handler for local development
const handler = serve({
  client: inngest,
  functions: [
    jobCreatedFunction
  ],
  logLevel: 'info'
});

// Export for local development
module.exports = handler;