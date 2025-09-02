import { config } from 'dotenv';
import { db, plans, orgs } from './src/lib/db.js';

// Load environment variables
config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test plans table
    const planResults = await db.select().from(plans);
    console.log(`✅ Plans table: ${planResults.length} plans found`);
    planResults.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.code}): ${plan.monthlyQuota} requests/month`);
    });
    
    // Test orgs table
    const orgCount = await db.select().from(orgs);
    console.log(`✅ Orgs table: ${orgCount.length} organizations found`);
    
    console.log('✅ Database connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Make sure DATABASE_URL is set in your environment');
    process.exit(1);
  }
}

testConnection();
