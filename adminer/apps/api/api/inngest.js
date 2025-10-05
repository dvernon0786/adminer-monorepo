const { serve } = require("inngest/next");
const { inngest } = require("../src/inngest/client");
const { jobCreatedFunction, aiAnalyze } = require("../src/inngest/functions");

// Create Inngest serve handler that properly registers functions with Inngest Cloud
const handler = serve({
  client: inngest,
  functions: [jobCreatedFunction, aiAnalyze],
  streaming: false,
  logLevel: 'info'
});

module.exports = handler;
