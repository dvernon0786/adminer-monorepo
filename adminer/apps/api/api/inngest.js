import { serve } from 'inngest/next';
import { inngest, jobCreated, quotaExceeded, subscriptionUpdated, apifyRunCompleted, apifyRunFailed } from '../src/inngest/functions.js';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    jobCreated,
    quotaExceeded,
    subscriptionUpdated,
    apifyRunCompleted,
    apifyRunFailed,
  ],
});