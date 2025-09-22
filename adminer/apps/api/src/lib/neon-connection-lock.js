
// Neon Database Connection Lock - Architecture Lock Phase 2
// This file locks the working Neon database connection patterns

const { NeonConfigLock } = require('./neon-config.js');

class NeonConnectionLock {
  constructor() {
    this.config = new NeonConfigLock();
    this.connectionPatterns = this.initializeConnectionPatterns();
  }

  initializeConnectionPatterns() {
    return {
      // Lock the working connection configuration
      connection: {
        connectionString: this.config.config.connectionString,
        directUrl: this.config.config.directUrl,
        ssl: { rejectUnauthorized: false },
        pool: { min: 0, max: 10 },
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      },
      
      // Lock the working query patterns
      queryPatterns: {
        taggedTemplate: true,
        parameterized: true,
        sanitization: 'automatic'
      },
      
      // Lock the working transaction patterns
      transactionPatterns: {
        isolation: 'READ_COMMITTED',
        timeout: 30000,
        retryAttempts: 3
      }
    };
  }

  getConnectionConfig() {
    return this.connectionPatterns.connection;
  }

  // Lock the working query execution pattern
  async executeQuery(query, params = []) {
    const { sql } = await import('../../packages/database/index.js');
    
    try {
      console.log('🗄️ NEON_QUERY_EXECUTION_LOCK', {
        query: query.substring(0, 100) + '...',
        paramCount: params.length,
        timestamp: new Date().toISOString()
      });
      
      const result = await sql`${query}`;
      return result;
    } catch (error) {
      console.error('💥 NEON_QUERY_ERROR_LOCK', {
        error: error.message,
        query: query.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Lock the working transaction pattern
  async executeTransaction(queries) {
    const { sql } = await import('../../packages/database/index.js');
    
    try {
      console.log('🔄 NEON_TRANSACTION_LOCK', {
        queryCount: queries.length,
        timestamp: new Date().toISOString()
      });
      
      return await sql.begin(async (sql) => {
        const results = [];
        for (const query of queries) {
          const result = await sql`${query}`;
          results.push(result);
        }
        return results;
      });
    } catch (error) {
      console.error('💥 NEON_TRANSACTION_ERROR_LOCK', {
        error: error.message,
        queryCount: queries.length,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

module.exports = { NeonConnectionLock };
