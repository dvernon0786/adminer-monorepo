// Inngest Serve Handler
// Properly registers functions with Inngest Cloud using serve() function

const { serve } = require("inngest/next");
const { inngest } = require("../src/inngest/client");
const { jobCreatedFunction, aiAnalyze } = require("../src/inngest/functions");

module.exports = serve({
  client: inngest,
  functions: [jobCreatedFunction, aiAnalyze]
});
