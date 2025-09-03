import { serve } from 'inngest/next';
import { Inngest } from 'inngest';

// Create a simple Inngest client
const inngest = new Inngest({ 
  id: 'adminer-jobs',
  name: 'Adminer Job Pipeline'
});

// Create simple test functions
const testFunction = inngest.createFunction(
  { id: 'test-function' },
  { event: 'test/event' },
  async ({ event, step }) => {
    console.log('Test function triggered:', event);
    return { success: true, message: 'Test function executed' };
  }
);

// Create the proper Inngest serve endpoint
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [testFunction],
  streaming: false, // Disable streaming for Vercel compatibility
});