
// Neon Database Configuration Lock - Architecture Lock Phase 1
// This file locks the Neon database connection patterns to prevent regression

class NeonConfigLock {
  constructor() {
    this.config = {
      connectionString: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL,
      branchId: process.env.NEON_BRANCH_ID,
      username: process.env.NEON_DATABASE_USERNAME,
      password: process.env.NEON_DATABASE_PASSWORD
    };
    
    this.validateConfig();
  }

  validateConfig() {
    if (!this.config.connectionString) {
      throw new Error('DATABASE_URL is required');
    }
  }

  getDatabaseConfig() {
    return {
      connectionString: this.config.connectionString,
      directUrl: this.config.directUrl,
      ssl: { rejectUnauthorized: false },
      pool: { min: 0, max: 10 }
    };
  }
}

module.exports = { NeonConfigLock };
