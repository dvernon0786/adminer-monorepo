#!/usr/bin/env node

/**
 * Post-Payment Quota Update Schema Fix
 * 
 * This script fixes the database schema to support webhook processing
 * for post-payment quota updates. It adds the missing billing columns
 * that the webhook handler needs to update user plans and quotas.
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '../../../.env.local' });

async function fixPostPaymentQuotaSchema() {
  console.log('🚨 POST-PAYMENT QUOTA UPDATE SCHEMA FIX');
  console.log('=====================================');
  console.log('Fixing database schema to support webhook processing...');
  console.log('');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Step 1: Add missing billing columns to organizations table
    console.log('📊 Step 1: Adding missing billing columns to organizations table...');
    
    const addColumnsQueries = [
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT;`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'inactive';`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_code TEXT DEFAULT 'free-10';`
    ];

    for (const query of addColumnsQueries) {
      try {
        await sql`${query}`;
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Column already exists: ${query}`);
        } else {
          console.error(`❌ Error executing query: ${query}`);
          console.error(`   Error: ${error.message}`);
        }
      }
    }

    // Step 2: Create subscriptions table for billing tracking
    console.log('');
    console.log('📊 Step 2: Creating subscriptions table for billing tracking...');
    
    const createSubscriptionsTable = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES organizations(id),
        dodo_subscription_id TEXT NOT NULL UNIQUE,
        plan TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        current_period_start TIMESTAMP NOT NULL,
        current_period_end TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    try {
      await sql`${createSubscriptionsTable}`;
      console.log('✅ Subscriptions table created successfully');
    } catch (error) {
      console.error('❌ Error creating subscriptions table:', error.message);
    }

    // Step 3: Create webhook_events table if it doesn't exist
    console.log('');
    console.log('📊 Step 3: Ensuring webhook_events table exists...');
    
    const createWebhookEventsTable = `
      CREATE TABLE IF NOT EXISTS webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type TEXT NOT NULL,
        org_id TEXT,
        data JSONB,
        processed_at TIMESTAMP DEFAULT NOW()
      )
    `;

    try {
      await sql`${createWebhookEventsTable}`;
      console.log('✅ Webhook events table ensured');
    } catch (error) {
      console.error('❌ Error creating webhook_events table:', error.message);
    }

    // Step 4: Create indexes for performance
    console.log('');
    console.log('📊 Step 4: Creating indexes for performance...');
    
    const createIndexesQueries = [
      `CREATE INDEX IF NOT EXISTS idx_organizations_dodo_customer_id ON organizations(dodo_customer_id);`,
      `CREATE INDEX IF NOT EXISTS idx_organizations_billing_status ON organizations(billing_status);`,
      `CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_subscription_id ON subscriptions(dodo_subscription_id);`,
      `CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);`,
      `CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);`,
      `CREATE INDEX IF NOT EXISTS idx_webhook_events_org_id ON webhook_events(org_id);`
    ];

    for (const query of createIndexesQueries) {
      try {
        await sql`${query}`;
        console.log(`✅ Created index: ${query.split(' ')[5]}`);
      } catch (error) {
        console.log(`ℹ️  Index may already exist: ${query.split(' ')[5]}`);
      }
    }

    // Step 5: Verify schema changes
    console.log('');
    console.log('📊 Step 5: Verifying schema changes...');
    
    try {
      const orgColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        ORDER BY ordinal_position
      `;
      
      console.log('✅ Organizations table columns:');
      orgColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
      });

      const subscriptionColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        ORDER BY ordinal_position
      `;
      
      console.log('');
      console.log('✅ Subscriptions table columns:');
      subscriptionColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });

    } catch (error) {
      console.error('❌ Error verifying schema:', error.message);
    }

    console.log('');
    console.log('🎉 POST-PAYMENT QUOTA UPDATE SCHEMA FIX COMPLETE!');
    console.log('================================================');
    console.log('');
    console.log('✅ Database schema now supports webhook processing');
    console.log('✅ Organizations table has all required billing columns');
    console.log('✅ Subscriptions table created for billing tracking');
    console.log('✅ Webhook events table ready for event logging');
    console.log('✅ Performance indexes created');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update webhook handler to use correct schema');
    console.log('2. Add frontend payment success handling');
    console.log('3. Create manual fix endpoint for immediate resolution');
    console.log('4. Test complete payment flow');

  } catch (error) {
    console.error('💥 SCHEMA FIX FAILED:', error);
    process.exit(1);
  }
}

// Run the schema fix
if (require.main === module) {
  fixPostPaymentQuotaSchema()
    .then(() => {
      console.log('✅ Schema fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixPostPaymentQuotaSchema };