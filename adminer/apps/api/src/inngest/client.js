// Inngest client configuration
const { Inngest } = require('inngest');
const { serve } = require('inngest/express');

// Create Inngest client
const inngest = new Inngest({
  id: 'adminer-jobs',
  name: 'Adminer Job Pipeline',
  env: process.env.NODE_ENV || 'production',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  baseUrl: process.env.INNGEST_BASE_URL || 'https://api.inngest.com'
});

module.exports = { inngest, serve };