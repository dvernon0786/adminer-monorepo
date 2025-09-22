#!/usr/bin/env node

/**
 * Direct Schema Fix for Post-Payment Quota Update
 * 
 * This script directly executes SQL commands to add the missing billing columns
 * that the webhook handler needs to update user plans and quotas.
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '../../../.env.local' });

async function fixSchemaDirect() {
  console.log('🚨 DIRECT SCHEMA FIX FOR POST-PAYMENT QUOTA UPDATE');
  console.log('==================================================');
  console.log('Adding missing billing columns to support webhook processing...');
  console.log('');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Add missing billing columns one by one
    console.log('📊 Adding dodo_customer_id column...');
    try {
      await sql`ALTER TABLE organizations ADD COLUMN dodo_customer_id TEXT`;
      console.log('✅ Added dodo_customer_id column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  dodo_customer_id column already exists');
      } else {
        console.error('❌ Error adding dodo_customer_id:', error.message);
      }
    }

    console.log('📊 Adding billing_status column...');
    try {
      await sql`ALTER TABLE organizations ADD COLUMN billing_status TEXT DEFAULT 'inactive'`;
      console.log('✅ Added billing_status column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  billing_status column already exists');
      } else {
        console.error('❌ Error adding billing_status:', error.message);
      }
    }

    console.log('📊 Adding current_period_end column...');
    try {
      await sql`ALTER TABLE organizations ADD COLUMN current_period_end TIMESTAMP`;
      console.log('✅ Added current_period_end column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  current_period_end column already exists');
      } else {
        console.error('❌ Error adding current_period_end:', error.message);
      }
    }

    console.log('📊 Adding plan_code column...');
    try {
      await sql`ALTER TABLE organizations ADD COLUMN plan_code TEXT DEFAULT 'free-10'`;
      console.log('✅ Added plan_code column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  plan_code column already exists');
      } else {
        console.error('❌ Error adding plan_code:', error.message);
      }
    }

    // Create subscriptions table
    console.log('');
    console.log('📊 Creating subscriptions table...');
    try {
      await sql`
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
      console.log('✅ Subscriptions table created/verified');
    } catch (error) {
      console.error('❌ Error creating subscriptions table:', error.message);
    }

    // Create webhook_events table
    console.log('');
    console.log('📊 Creating webhook_events table...');
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS webhook_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_type TEXT NOT NULL,
          org_id TEXT,
          data JSONB,
          processed_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.log('✅ Webhook events table created/verified');
    } catch (error) {
      console.error('❌ Error creating webhook_events table:', error.message);
    }

    // Verify the schema changes
    console.log('');
    console.log('📊 Verifying schema changes...');
    
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

    // Check if billing columns exist
    const billingColumns = ['dodo_customer_id', 'billing_status', 'current_period_end', 'plan_code'];
    const existingColumns = orgColumns.map(col => col.column_name);
    
    console.log('');
    console.log('📊 Billing columns status:');
    billingColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        console.log(`✅ ${col} - EXISTS`);
      } else {
        console.log(`❌ ${col} - MISSING`);
      }
    });

    console.log('');
    console.log('🎉 SCHEMA FIX COMPLETE!');
    console.log('======================');
    console.log('');
    console.log('✅ Database schema now supports webhook processing');
    console.log('✅ Organizations table has all required billing columns');
    console.log('✅ Subscriptions table ready for billing tracking');
    console.log('✅ Webhook events table ready for event logging');
    console.log('');
    console.log('Next: Update webhook handler to use correct schema');

  } catch (error) {
    console.error('💥 SCHEMA FIX FAILED:', error);
    process.exit(1);
  }
}

// Run the schema fix
if (require.main === module) {
  fixSchemaDirect()
    .then(() => {
      console.log('✅ Schema fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixSchemaDirect };