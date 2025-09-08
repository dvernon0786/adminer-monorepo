#!/usr/bin/env node

// Check Table Structure - Detailed view of jobs table
require('dotenv').config({ path: '.env.local' });

async function checkTableStructure() {
  console.log('🔍 Checking Jobs Table Structure...\n');
  
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment');
    }
    
    const postgres = require('postgres');
    const sql = postgres(databaseUrl, { ssl: 'require' });
    
    // Check jobs table structure
    console.log('📋 Jobs Table Columns:');
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'jobs' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      console.log(`   - ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
    });
    
    console.log('');
    
    // Check if ads-based quota fields exist
    console.log('🎯 Checking for Ads-Based Quota Fields:');
    const hasAdsRequested = columns.some(col => col.column_name === 'ads_requested');
    const hasAdsImported = columns.some(col => col.column_name === 'ads_imported');
    const hasQuotaDebit = columns.some(col => col.column_name === 'quota_debit');
    
    console.log(`   - ads_requested: ${hasAdsRequested ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   - ads_imported: ${hasAdsImported ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   - quota_debit: ${hasQuotaDebit ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!hasAdsRequested || !hasAdsImported) {
      console.log('\n⚠️  Missing ads-based quota fields!');
      console.log('   The jobs table needs to be updated with the latest migration.');
    }
    
    console.log('');
    
    // Check orgs table structure for quota fields
    console.log('📋 Orgs Table Quota Fields:');
    const orgColumns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'orgs' AND table_schema = 'public'
        AND column_name LIKE '%quota%'
      ORDER BY ordinal_position
    `;
    
    if (orgColumns.length === 0) {
      console.log('   No quota-related columns found');
    } else {
      orgColumns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
    }
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
    process.exit(1);
  }
}

checkTableStructure()
  .then(() => {
    console.log('✅ Table structure check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during table structure check:', error);
    process.exit(1);
  }); 