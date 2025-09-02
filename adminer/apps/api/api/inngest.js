import { inngest, jobEvents } from '../src/lib/inngest.js';

// Serve Inngest functions
export default inngest.serve({
  client: inngest,
  functions: [
    jobEvents.jobCreated,
    jobEvents.quotaExceeded,
    jobEvents.subscriptionUpdated,
    jobEvents.apifyRunCompleted,
    jobEvents.apifyRunFailed
  ]
});