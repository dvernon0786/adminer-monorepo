#!/usr/bin/env node

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('❌ NEON_DATABASE_URL (or DATABASE_URL) not set in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

async function testMigration() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');

    // Test 1: Check if pgcrypto extension can be created
    console.log('\n🧪 Test 1: pgcrypto extension');
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
      console.log('✅ pgcrypto extension available');
    } catch (e) {
      console.log('⚠️  pgcrypto extension error (may already exist):', e.message);
    }

    // Test 2: Check current orgs table structure
    console.log('\n🧪 Test 2: Current orgs table structure');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'orgs'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // Test 3: Check if external_id column exists
    const hasExternalId = columns.rows.some(col => col.column_name === 'external_id');
    if (hasExternalId) {
      console.log('✅ external_id column already exists');
    } else {
      console.log('❌ external_id column missing - migration needed');
    }

    // Test 4: Check existing orgs data
    console.log('\n🧪 Test 3: Existing orgs data');
    const orgs = await client.query('SELECT id, name, plan FROM orgs LIMIT 5;');
    if (orgs.rows.length > 0) {
      console.log(`Found ${orgs.rows.length} orgs:`);
      orgs.rows.forEach(org => {
        console.log(`  - ${org.id}: ${org.name} (${org.plan})`);
      });
    } else {
      console.log('No orgs found in database');
    }

    // Test 5: Simulate migration steps
    console.log('\n🧪 Test 4: Migration simulation');
    if (!hasExternalId) {
      console.log('Would add external_id column...');
      console.log('Would backfill with UUIDs...');
      console.log('Would set NOT NULL constraint...');
      console.log('Would add unique constraint...');
    } else {
      console.log('Migration already applied - no action needed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testMigration().catch(console.error); 