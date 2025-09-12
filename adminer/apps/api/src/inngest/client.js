// Inngest client configuration
import { Inngest } from 'inngest';

// Fixed Inngest client with proper configuration
export const inngest = new Inngest({
  id: 'adminer-app',
  name: 'Adminer Job Processor',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  isDev: process.env.NODE_ENV === 'development'
});

// Debug logging for environment variables
console.log('Inngest Client Initialized:', {
  hasEventKey: !!process.env.INNGEST_EVENT_KEY,
  hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
  environment: process.env.NODE_ENV
});