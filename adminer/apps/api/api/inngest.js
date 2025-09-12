// Official Vercel/Inngest pattern implementation
import { serve } from 'inngest/next';
import { 
  inngest,
  jobCreated,
  quotaExceeded,
  subscriptionUpdated,
  apifyRunCompleted,
  apifyRunFailed,
  apifyRunStart
} from '../src/inngest/functions.js';

// Official Vercel/Next.js serve pattern
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    jobCreated,
    quotaExceeded,
    subscriptionUpdated,
    apifyRunCompleted,
    apifyRunFailed,
    apifyRunStart
  ]
});