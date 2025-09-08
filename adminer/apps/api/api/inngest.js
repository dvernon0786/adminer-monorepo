const { serve } = require('inngest/next');
const { inngest, jobCreated, quotaExceeded, subscriptionUpdated, apifyRunCompleted, apifyRunFailed } = require('../src/inngest/functions.js');

const handlers = serve({
  client: inngest,
  functions: [
    jobCreated,
    quotaExceeded,
    subscriptionUpdated,
    apifyRunCompleted,
    apifyRunFailed,
  ],
});

module.exports = handlers;