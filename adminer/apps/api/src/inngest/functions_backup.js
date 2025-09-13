import { inngest } from './client.js';

// Minimal test function
const minimalTest = inngest.createFunction(
  { id: 'minimal-test' },
  { event: 'job.created' },
  async ({ event, step }) => {
    console.log('Minimal test function executed:', event.data);
    return { success: true, message: 'Minimal test completed' };
  }
);

export {
  inngest,
  minimalTest
};