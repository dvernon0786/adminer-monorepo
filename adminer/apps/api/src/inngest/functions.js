import { inngest } from './client.js';
import { neon } from '@neondatabase/serverless';

// Real database connection for Inngest functions
const database = neon(process.env.DATABASE_URL);

// Simple test function
const testFunction = inngest.createFunction(
  { id: 'test-function' },
  { event: 'job.created' },
  async ({ event, step }) => {
    console.log('Test function executed:', event.data);
    
    try {
      // Simple database test
      const result = await database.query("SELECT 1 as test");
      console.log('Database test result:', result);
      
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Test function error:', error);
      throw error;
    }
  }
);

export {
  inngest,
  testFunction
};