import { serve } from 'inngest/next';
import { inngest, jobCreated, quotaExceeded, subscriptionUpdated, apifyRunCompleted, apifyRunFailed } from '@/inngest/functions';

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