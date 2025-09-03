import { serve } from 'inngest/next';
import { inngest, jobEvents } from '../src/lib/inngest.js';

// Create the proper Inngest serve endpoint
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    jobEvents.jobCreated,
    jobEvents.quotaExceeded,
    jobEvents.subscriptionUpdated,
    jobEvents.apifyRunCompleted,
    jobEvents.apifyRunFailed
  ],
  streaming: false, // Disable streaming for Vercel compatibility
});