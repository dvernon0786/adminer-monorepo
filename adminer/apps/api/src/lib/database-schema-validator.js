
// Database Schema Validation - Architecture Lock Phase 3
// This file validates the database schema to prevent regression

class DatabaseSchemaValidator {
  constructor() {
    this.requiredTables = [
      'organizations',
      'subscriptions', 
      'webhook_events',
      'scraping_jobs'
    ];
    
    this.requiredColumns = {
      organizations: [
        'id', 'name', 'clerk_org_id', 'plan', 'quota_used', 'quota_limit',
        'dodo_customer_id', 'billing_status', 'created_at', 'updated_at'
      ],
      subscriptions: [
        'id', 'org_id', 'dodo_subscription_id', 'plan', 'status',
        'amount', 'currency', 'created_at', 'updated_at'
      ],
      webhook_events: [
        'id', 'event_type', 'event_id', 'org_id', 'data',
        'processed', 'processed_at', 'created_at'
      ],
      scraping_jobs: [
        'id', 'org_id', 'keyword', 'status', 'apify_run_id',
        'results_count', 'results_data', 'created_at'
      ]
    };
    
    this.requiredIndexes = [
      'idx_organizations_clerk_org_id',
      'idx_organizations_plan',
      'idx_subscriptions_org_id',
      'idx_subscriptions_dodo_subscription_id',
      'idx_webhook_events_event_type',
      'idx_webhook_events_org_id',
      'idx_scraping_jobs_org_id',
      'idx_scraping_jobs_status'
    ];
  }

  async validateSchema() {
    console.log('🔍 DATABASE_SCHEMA_VALIDATION_LOCK', {
      timestamp: new Date().toISOString(),
      requiredTables: this.requiredTables.length,
      requiredIndexes: this.requiredIndexes.length
    });

    const { sql } = await import('../../packages/database/index.js');
    const results = {
      tables: {},
      columns: {},
      indexes: {},
      functions: {},
      valid: true,
      errors: []
    };

    try {
      // Validate tables exist
      for (const tableName of this.requiredTables) {
        const tableExists = await this.checkTableExists(sql, tableName);
        results.tables[tableName] = tableExists;
        
        if (!tableExists) {
          results.valid = false;
          results.errors.push(`Missing table: ${tableName}`);
        }
      }

      // Validate columns exist
      for (const [tableName, columns] of Object.entries(this.requiredColumns)) {
        results.columns[tableName] = {};
        
        for (const columnName of columns) {
          const columnExists = await this.checkColumnExists(sql, tableName, columnName);
          results.columns[tableName][columnName] = columnExists;
          
          if (!columnExists) {
            results.valid = false;
            results.errors.push(`Missing column: ${tableName}.${columnName}`);
          }
        }
      }

      // Validate indexes exist
      for (const indexName of this.requiredIndexes) {
        const indexExists = await this.checkIndexExists(sql, indexName);
        results.indexes[indexName] = indexExists;
        
        if (!indexExists) {
          results.valid = false;
          results.errors.push(`Missing index: ${indexName}`);
        }
      }

      // Validate functions exist
      const requiredFunctions = [
        'update_organization_quota',
        'upgrade_organization_plan',
        'process_webhook_event',
        'get_organization_quota_status'
      ];
      
      for (const functionName of requiredFunctions) {
        const functionExists = await this.checkFunctionExists(sql, functionName);
        results.functions[functionName] = functionExists;
        
        if (!functionExists) {
          results.valid = false;
          results.errors.push(`Missing function: ${functionName}`);
        }
      }

      if (results.valid) {
        console.log('✅ DATABASE_SCHEMA_VALIDATION_PASSED_LOCK');
      } else {
        console.error('❌ DATABASE_SCHEMA_VALIDATION_FAILED_LOCK', {
          errors: results.errors
        });
      }

      return results;

    } catch (error) {
      console.error('💥 DATABASE_SCHEMA_VALIDATION_ERROR_LOCK', {
        error: error.message,
        stack: error.stack
      });
      
      results.valid = false;
      results.errors.push(`Validation error: ${error.message}`);
      return results;
    }
  }

  async checkTableExists(sql, tableName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = ${tableName}
      )
    `;
    return result[0]?.exists || false;
  }

  async checkColumnExists(sql, tableName, columnName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = ${tableName} AND column_name = ${columnName}
      )
    `;
    return result[0]?.exists || false;
  }

  async checkIndexExists(sql, indexName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = ${indexName}
      )
    `;
    return result[0]?.exists || false;
  }

  async checkFunctionExists(sql, functionName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = ${functionName} AND routine_type = 'FUNCTION'
      )
    `;
    return result[0]?.exists || false;
  }
}

module.exports = { DatabaseSchemaValidator };
