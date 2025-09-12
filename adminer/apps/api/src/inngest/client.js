// Inngest client configuration
import { Inngest } from 'inngest';

// Create Inngest client
export const inngest = new Inngest({
  id: 'adminer-jobs',
  name: 'Adminer Job Pipeline',
  env: process.env.NODE_ENV || 'production',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  baseUrl: process.env.INNGEST_BASE_URL || 'https://api.inngest.com'
});