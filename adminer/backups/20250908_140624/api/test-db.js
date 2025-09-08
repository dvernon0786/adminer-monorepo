import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '../../../.env.local' });

async function testDB() {
  try {
    console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL not found in environment');
      return;
    }
    console.log('Testing database connection...');
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
}

testDB();