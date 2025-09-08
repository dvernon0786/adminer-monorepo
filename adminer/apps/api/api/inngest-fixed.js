// Proper Inngest serve endpoint for Vercel
import { serve } from 'inngest/next';
import { inngest } from '../src/lib/inngest.js';

// Import all functions
import { 
  jobCreated, 
  quotaExceeded, 
  subscriptionUpdated, 
  apifyRunCompleted, 
  apifyRunFailed 
} from '../src/lib/inngest.js';

// Create the serve handler with all functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    jobCreated,
    quotaExceeded,
    subscriptionUpdated,
    apifyRunCompleted,
    apifyRunFailed
  ],
});
