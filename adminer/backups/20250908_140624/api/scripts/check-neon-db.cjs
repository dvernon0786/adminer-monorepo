#!/usr/bin/env node

// Check Neon Database - List everything created
require('dotenv').config({ path: '.env.local' });

async function checkNeonDatabase() {
  console.log('🔍 Checking Neon Database...\n');
  
  try {
    // Load environment variables
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment');
    }
    
    console.log('📡 Testing connection to Neon...');
    console.log(`   URL: ${databaseUrl.replace(/:[^:@]*@/, ':****@')}\n`);
    
    // Use postgres directly for connection test
    const postgres = require('postgres');
    const sql = postgres(databaseUrl, { ssl: 'require' });
    
    // 1. Test connection
    const result = await sql`SELECT NOW() as current_time, current_database() as db_name, current_user as user`;
    console.log('✅ Database connection successful');
    console.log(`   Database: ${result[0].db_name}`);
    console.log(`   User: ${result[0].user}`);
    console.log(`   Time: ${result[0].current_time}\n`);
    
    // 2. List all schemas
    console.log('📚 Available Schemas:');
    const schemas = await sql`
      SELECT schema_name, schema_owner 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `;
    
    if (schemas.length === 0) {
      console.log('   No custom schemas found');
    } else {
      schemas.forEach(schema => {
        console.log(`   - ${schema.schema_name} (owner: ${schema.schema_owner})`);
      });
    }
    console.log('');
    
    // 3. List all tables in public schema
    console.log('🗃️  Tables in public schema:');
    const tables = await sql`
      SELECT 
        table_name,
        table_type,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('   No tables found in public schema');
    } else {
      tables.forEach(table => {
        console.log(`   - ${table.table_name} (${table.table_type}, ${table.column_count} columns)`);
      });
    }
    console.log('');
    
    // 4. Check for any existing data
    if (tables.length > 0) {
      console.log('📊 Table Contents:');
      for (const table of tables) {
        if (table.table_type === 'BASE TABLE') {
          try {
            const count = await sql`SELECT COUNT(*) as count FROM ${sql(table.table_name)}`;
            const rowCount = parseInt(count[0]?.count || '0');
            console.log(`   - ${table.table_name}: ${rowCount} rows`);
            
            // Show sample data for non-empty tables
            if (rowCount > 0) {
              const sample = await sql`SELECT * FROM ${sql(table.table_name)} LIMIT 3`;
              console.log(`     Sample data:`, JSON.stringify(sample, null, 2));
            }
          } catch (err) {
            console.log(`   - ${table.table_name}: Error reading - ${err.message}`);
          }
        }
      }
      console.log('');
    }
    
    // 5. Check for any sequences
    console.log('🔢 Sequences:');
    const sequences = await sql`
      SELECT sequence_name, data_type, start_value
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name
    `;
    
    if (sequences.length === 0) {
      console.log('   No sequences found');
    } else {
      sequences.forEach(seq => {
        console.log(`   - ${seq.sequence_name} (${seq.data_type}, start: ${seq.start_value})`);
      });
    }
    console.log('');
    
    // 6. Check for any indexes
    console.log('📇 Indexes:');
    const indexes = await sql`
      SELECT 
        indexname,
        tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;
    
    if (indexes.length === 0) {
      console.log('   No indexes found');
    } else {
      indexes.forEach(idx => {
        console.log(`   - ${idx.indexname} on ${idx.tablename}`);
      });
    }
    console.log('');
    
    // 7. Check for any constraints
    console.log('🔒 Constraints:');
    const constraints = await sql`
      SELECT 
        constraint_name,
        table_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      ORDER BY table_name, constraint_name
    `;
    
    if (constraints.length === 0) {
      console.log('   No constraints found');
    } else {
      constraints.forEach(constraint => {
        console.log(`   - ${constraint.constraint_name} on ${constraint.table_name} (${constraint.constraint_type})`);
      });
    }
    console.log('');
    
    // 8. Check database size and stats
    console.log('📈 Database Statistics:');
    try {
      const stats = await sql`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as db_size,
          current_database() as db_name,
          current_user as current_user
      `;
      console.log(`   - Database: ${stats[0].db_name}`);
      console.log(`   - Size: ${stats[0].db_size}`);
      console.log(`   - User: ${stats[0].current_user}`);
    } catch (err) {
      console.log(`   - Could not get database stats: ${err.message}`);
    }
    
    // Close connection
    await sql.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Make sure your DATABASE_URL is correct and Neon database is accessible');
    process.exit(1);
  }
}

// Run the check
checkNeonDatabase()
  .then(() => {
    console.log('✅ Neon database check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during database check:', error);
    process.exit(1);
  }); 