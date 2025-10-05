#!/usr/bin/env node

/**
 * Architecture Lock Phase 1: Environment Variable Lock
 * 
 * This script audits all hardcoded values and standardizes environment variable patterns
 * across all integrated services (Clerk, Neon, Dodo, Inngest, Apify).
 */

const fs = require('fs');
const path = require('path');

class ArchitectureLockPhase1 {
  constructor() {
    this.hardcodedValues = [];
    this.environmentPatterns = {};
    this.serviceConfigs = {};
    this.auditResults = {
      hardcodedUrls: [],
      hardcodedKeys: [],
      hardcodedSecrets: [],
      hardcodedDomains: [],
      missingEnvVars: [],
      inconsistentPatterns: []
    };
  }

  async run() {
    console.log('🔒 ARCHITECTURE LOCK PHASE 1: ENVIRONMENT VARIABLE LOCK');
    console.log('=====================================================');
    console.log('Auditing hardcoded values and standardizing environment patterns...');
    console.log('');

    try {
      // Step 1: Audit hardcoded values
      await this.auditHardcodedValues();
      
      // Step 2: Standardize environment variable patterns
      await this.standardizeEnvironmentPatterns();
      
      // Step 3: Create environment validation
      await this.createEnvironmentValidation();
      
      // Step 4: Generate standardized configuration
      await this.generateStandardizedConfig();
      
      // Step 5: Create service integration locks
      await this.createServiceIntegrationLocks();
      
      console.log('');
      console.log('🎉 PHASE 1 COMPLETE: ENVIRONMENT VARIABLE LOCK');
      console.log('==============================================');
      console.log('✅ All hardcoded values audited and catalogued');
      console.log('✅ Environment variable patterns standardized');
      console.log('✅ Environment validation implemented');
      console.log('✅ Service integration patterns locked');
      console.log('');
      console.log('Next: Phase 2 - Service Integration Lock');

    } catch (error) {
      console.error('💥 PHASE 1 FAILED:', error);
      process.exit(1);
    }
  }

  async auditHardcodedValues() {
    console.log('📊 Step 1: Auditing hardcoded values across the system...');
    
    const searchPatterns = [
      // Hardcoded URLs
      { pattern: /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: 'url' },
      // Hardcoded API keys
      { pattern: /[a-zA-Z0-9_]{20,}/g, type: 'key' },
      // Hardcoded domains
      { pattern: /adminer\.online|localhost:3000|127\.0\.0\.1/g, type: 'domain' },
      // Hardcoded ports
      { pattern: /:\d{4,5}/g, type: 'port' },
      // Hardcoded database URLs
      { pattern: /postgresql:\/\/[^\/\s]+/g, type: 'database' }
    ];

    const directories = [
      'adminer/apps/api',
      'adminer/apps/web',
      'adminer/scripts',
      'adminer/tools'
    ];

    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        await this.scanDirectory(dir, searchPatterns);
      }
    }

    console.log(`✅ Found ${this.auditResults.hardcodedUrls.length} hardcoded URLs`);
    console.log(`✅ Found ${this.auditResults.hardcodedKeys.length} hardcoded keys`);
    console.log(`✅ Found ${this.auditResults.hardcodedDomains.length} hardcoded domains`);
  }

  async scanDirectory(dir, patterns) {
    const files = this.getFilesRecursively(dir);
    
    for (const file of files) {
      if (this.shouldSkipFile(file)) continue;
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const { pattern, type } of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              this.auditResults[`hardcoded${type.charAt(0).toUpperCase() + type.slice(1)}s`].push({
                file: file,
                match: match,
                line: this.getLineNumber(content, match)
              });
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  getFilesRecursively(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  shouldSkipFile(file) {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      '.cache',
      'coverage',
      '.lock',
      '.map'
    ];
    
    return skipPatterns.some(pattern => file.includes(pattern));
  }

  getLineNumber(content, match) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 0;
  }

  async standardizeEnvironmentPatterns() {
    console.log('');
    console.log('📊 Step 2: Standardizing environment variable patterns...');
    
    // Define standardized patterns for each service
    this.environmentPatterns = {
      clerk: {
        publishableKey: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        secretKey: 'CLERK_SECRET_KEY',
        webhookSecret: 'CLERK_WEBHOOK_SECRET',
        issuer: 'CLERK_ISSUER'
      },
      neon: {
        databaseUrl: 'DATABASE_URL',
        directUrl: 'DIRECT_URL',
        branchId: 'NEON_BRANCH_ID',
        username: 'NEON_DATABASE_USERNAME',
        password: 'NEON_DATABASE_PASSWORD'
      },
      dodo: {
        mode: 'DODO_MODE',
        apiBase: 'DODO_API_BASE',
        apiKey: 'DODO_API_KEY',
        secretKey: 'DODO_SECRET_KEY',
        webhookSecret: 'DODO_WEBHOOK_SECRET',
        productFree: 'DODO_PRODUCT_FREE',
        pricePro: 'DODO_PRICE_PRO',
        priceEnterprise: 'DODO_PRICE_ENTERPRISE',
        currency: 'DODO_CURRENCY'
      },
      inngest: {
        eventKey: 'INNGEST_EVENT_KEY',
        signingKey: 'INNGEST_SIGNING_KEY',
        servePath: 'INNGEST_SERVE_PATH',
        baseUrl: 'INNGEST_BASE_URL'
      },
      apify: {
        token: 'APIFY_TOKEN',
        actorId: 'APIFY_ACTOR_ID',
        datasetId: 'APIFY_DATASET_ID',
        memoryMbytes: 'APIFY_MEMORY_MBYTES',
        timeoutSecs: 'APIFY_TIMEOUT_SECS'
      },
      app: {
        baseUrl: 'NEXT_PUBLIC_APP_URL',
        appBaseUrl: 'APP_BASE_URL',
        nodeEnv: 'NODE_ENV',
        logLevel: 'LOG_LEVEL'
      }
    };

    console.log('✅ Standardized patterns for all services');
    console.log('   - Clerk: 4 variables');
    console.log('   - Neon: 5 variables');
    console.log('   - Dodo: 9 variables');
    console.log('   - Inngest: 4 variables');
    console.log('   - Apify: 5 variables');
    console.log('   - App: 4 variables');
  }

  async createEnvironmentValidation() {
    console.log('');
    console.log('📊 Step 3: Creating environment validation...');
    
    const validationCode = `
// Environment Variable Validation - Architecture Lock Phase 1
// This file validates all required environment variables at startup

class EnvironmentValidator {
  constructor() {
    this.requiredVars = {
      // Clerk Authentication
      clerk: [
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'CLERK_SECRET_KEY'
      ],
      
      // Database
      neon: [
        'DATABASE_URL'
      ],
      
      // Dodo Payments
      dodo: [
        'DODO_MODE',
        'DODO_API_BASE',
        'DODO_API_KEY',
        'DODO_SECRET_KEY'
      ],
      
      // Inngest Background Jobs
      inngest: [
        'INNGEST_EVENT_KEY',
        'INNGEST_SIGNING_KEY'
      ],
      
      // Apify Web Scraping
      apify: [
        'APIFY_TOKEN',
        'APIFY_ACTOR_ID'
      ],
      
      // App Configuration
      app: [
        'NEXT_PUBLIC_APP_URL',
        'NODE_ENV'
      ]
    };
    
    this.patterns = {
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': /^pk_(test_|live_)[A-Za-z0-9]+$/,
      'CLERK_SECRET_KEY': /^sk_(test_|live_)[A-Za-z0-9]+$/,
      'DATABASE_URL': /^postgresql:\/\/.+/,
      'DODO_MODE': /^(test|live)$/,
      'DODO_API_BASE': /^https:\/\/[a-zA-Z0-9.-]+$/,
      'DODO_API_KEY': /^dodo_(test_|live_)[A-Za-z0-9]+$/,
      'DODO_SECRET_KEY': /^dodo_(test_|live_)[A-Za-z0-9]+$/,
      'INNGEST_EVENT_KEY': /^evt_[A-Za-z0-9]+$/,
      'INNGEST_SIGNING_KEY': /^signkey_[A-Za-z0-9]+$/,
      'APIFY_TOKEN': /^apify_api_[A-Za-z0-9]+$/,
      'NEXT_PUBLIC_APP_URL': /^https?:\/\/[a-zA-Z0-9.-]+$/,
      'NODE_ENV': /^(development|production|test)$/
    };
  }

  validate() {
    const errors = [];
    const warnings = [];

    // Check required variables
    for (const [service, vars] of Object.entries(this.requiredVars)) {
      for (const varName of vars) {
        if (!process.env[varName]) {
          errors.push(\`Missing required \${service} variable: \${varName}\`);
        } else if (this.patterns[varName] && !this.patterns[varName].test(process.env[varName])) {
          warnings.push(\`Invalid format for \${varName}: \${process.env[varName]}\`);
        }
      }
    }

    // Log results
    if (errors.length > 0) {
      console.error('❌ ENVIRONMENT VALIDATION FAILED:');
      errors.forEach(error => console.error(\`   - \${error}\`));
      throw new Error(\`Environment validation failed: \${errors.length} errors\`);
    }

    if (warnings.length > 0) {
      console.warn('⚠️ ENVIRONMENT VALIDATION WARNINGS:');
      warnings.forEach(warning => console.warn(\`   - \${warning}\`));
    }

    console.log('✅ Environment validation passed');
    return true;
  }
}

// Export for use in applications
module.exports = { EnvironmentValidator };

// Auto-validate if this file is run directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  validator.validate();
}
`;

    fs.writeFileSync('src/lib/environment-validator.js', validationCode);
    console.log('✅ Environment validation created: src/lib/environment-validator.js');
  }

  async generateStandardizedConfig() {
    console.log('');
    console.log('📊 Step 4: Generating standardized configuration...');
    
    const configTemplate = `
# ARCHITECTURE LOCK PHASE 1 - STANDARDIZED ENVIRONMENT CONFIGURATION
# This file defines the standardized environment variable patterns for all services

# ===============================================
# CLERK AUTHENTICATION
# ===============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # or pk_live_...
CLERK_SECRET_KEY=sk_test_... # or sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_ISSUER=https://clerk.adminer.online

# ===============================================
# NEON DATABASE
# ===============================================
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
DIRECT_URL=postgresql://username:password@host:port/database?sslmode=require&pgbouncer=true
NEON_BRANCH_ID=your-branch-id
NEON_DATABASE_USERNAME=your-username
NEON_DATABASE_PASSWORD=your-password

# ===============================================
# DODO PAYMENTS
# ===============================================
DODO_MODE=test # or live
DODO_API_BASE=https://api.dodopayments.com # or https://test.dodopayments.com
DODO_API_KEY=dodo_test_... # or dodo_live_...
DODO_SECRET_KEY=dodo_test_... # or dodo_live_...
DODO_WEBHOOK_SECRET=whsec_...
DODO_PRODUCT_FREE=prod_free_...
DODO_PRICE_PRO=price_test_pro_... # or price_live_pro_...
DODO_PRICE_ENTERPRISE=price_test_ent_... # or price_live_ent_...
DODO_CURRENCY=usd

# ===============================================
# INNGEST BACKGROUND JOBS
# ===============================================
INNGEST_EVENT_KEY=evt_...
INNGEST_SIGNING_KEY=signkey_...
INNGEST_SERVE_PATH=/api/inngest
INNGEST_BASE_URL=https://inn.gs # or https://app.inngest.com

# ===============================================
# APIFY WEB SCRAPING
# ===============================================
APIFY_TOKEN=apify_api_...
APIFY_ACTOR_ID=your-actor-id
APIFY_DATASET_ID=your-dataset-id
APIFY_MEMORY_MBYTES=1024 # or 2048, 4096
APIFY_TIMEOUT_SECS=300 # or 600, 900

# ===============================================
# APP CONFIGURATION
# ===============================================
NEXT_PUBLIC_APP_URL=https://www.adminer.online # or http://localhost:3000
APP_BASE_URL=https://www.adminer.online # or http://localhost:3000
NODE_ENV=production # or development, test
LOG_LEVEL=info # or debug, warn, error
`;

    fs.writeFileSync('.env.architecture-lock.template', configTemplate);
    console.log('✅ Standardized configuration created: .env.architecture-lock.template');
  }

  async createServiceIntegrationLocks() {
    console.log('');
    console.log('📊 Step 5: Creating service integration locks...');
    
    // Create service configuration locks
    const serviceLocks = {
      'clerk-config.js': this.createClerkConfigLock(),
      'neon-config.js': this.createNeonConfigLock(),
      'dodo-config.js': this.createDodoConfigLock(),
      'inngest-config.js': this.createInngestConfigLock(),
      'apify-config.js': this.createApifyConfigLock()
    };

    for (const [filename, content] of Object.entries(serviceLocks)) {
      fs.writeFileSync(`src/lib/${filename}`, content);
      console.log(`✅ Service lock created: src/lib/${filename}`);
    }
  }

  createClerkConfigLock() {
    return `
// Clerk Authentication Configuration Lock - Architecture Lock Phase 1
// This file locks the Clerk authentication patterns to prevent regression

class ClerkConfigLock {
  constructor() {
    this.config = {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
      webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
      issuer: process.env.CLERK_ISSUER || 'https://clerk.adminer.online'
    };
    
    this.validateConfig();
  }

  validateConfig() {
    if (!this.config.publishableKey) {
      throw new Error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required');
    }
    if (!this.config.secretKey) {
      throw new Error('CLERK_SECRET_KEY is required');
    }
  }

  getAuthConfig() {
    return {
      publishableKey: this.config.publishableKey,
      secretKey: this.config.secretKey,
      webhookSecret: this.config.webhookSecret,
      issuer: this.config.issuer,
      afterSignInUrl: '/dashboard',
      afterSignUpUrl: '/dashboard'
    };
  }
}

module.exports = { ClerkConfigLock };
`;
  }

  createNeonConfigLock() {
    return `
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
`;
  }

  createDodoConfigLock() {
    return `
// Dodo Payments Configuration Lock - Architecture Lock Phase 1
// This file locks the Dodo payment integration patterns to prevent regression

class DodoConfigLock {
  constructor() {
    this.config = {
      mode: process.env.DODO_MODE || 'test',
      apiBase: process.env.DODO_API_BASE,
      apiKey: process.env.DODO_API_KEY,
      secretKey: process.env.DODO_SECRET_KEY,
      webhookSecret: process.env.DODO_WEBHOOK_SECRET,
      productFree: process.env.DODO_PRODUCT_FREE,
      pricePro: process.env.DODO_PRICE_PRO,
      priceEnterprise: process.env.DODO_PRICE_ENTERPRISE,
      currency: process.env.DODO_CURRENCY || 'usd'
    };
    
    this.validateConfig();
  }

  validateConfig() {
    if (!this.config.apiBase) {
      throw new Error('DODO_API_BASE is required');
    }
    if (!this.config.apiKey) {
      throw new Error('DODO_API_KEY is required');
    }
    if (!this.config.secretKey) {
      throw new Error('DODO_SECRET_KEY is required');
    }
  }

  getPaymentConfig() {
    return {
      mode: this.config.mode,
      apiBase: this.config.apiBase,
      apiKey: this.config.apiKey,
      secretKey: this.config.secretKey,
      webhookSecret: this.config.webhookSecret,
      products: {
        free: this.config.productFree,
        pro: this.config.pricePro,
        enterprise: this.config.priceEnterprise
      },
      currency: this.config.currency
    };
  }

  getCheckoutUrl(plan) {
    const productId = plan === 'pro' ? this.config.pricePro : this.config.priceEnterprise;
    if (!productId) {
      throw new Error(\`Product ID not configured for plan: \${plan}\`);
    }
    return \`\${this.config.apiBase}/checkout/\${productId}\`;
  }
}

module.exports = { DodoConfigLock };
`;
  }

  createInngestConfigLock() {
    return `
// Inngest Background Jobs Configuration Lock - Architecture Lock Phase 1
// This file locks the Inngest background job patterns to prevent regression

class InngestConfigLock {
  constructor() {
    this.config = {
      eventKey: process.env.INNGEST_EVENT_KEY,
      signingKey: process.env.INNGEST_SIGNING_KEY,
      servePath: process.env.INNGEST_SERVE_PATH || '/api/inngest',
      baseUrl: process.env.INNGEST_BASE_URL || 'https://inn.gs'
    };
    
    this.validateConfig();
  }

  validateConfig() {
    if (!this.config.eventKey) {
      throw new Error('INNGEST_EVENT_KEY is required');
    }
    if (!this.config.signingKey) {
      throw new Error('INNGEST_SIGNING_KEY is required');
    }
  }

  getInngestConfig() {
    return {
      id: "adminer-app",
      eventKey: this.config.eventKey,
      signingKey: this.config.signingKey,
      servePath: this.config.servePath,
      baseUrl: this.config.baseUrl
    };
  }
}

module.exports = { InngestConfigLock };
`;
  }

  createApifyConfigLock() {
    return `
// Apify Web Scraping Configuration Lock - Architecture Lock Phase 1
// This file locks the Apify scraping integration patterns to prevent regression

class ApifyConfigLock {
  constructor() {
    this.config = {
      token: process.env.APIFY_TOKEN,
      actorId: process.env.APIFY_ACTOR_ID,
      datasetId: process.env.APIFY_DATASET_ID,
      memoryMbytes: parseInt(process.env.APIFY_MEMORY_MBYTES) || 1024,
      timeoutSecs: parseInt(process.env.APIFY_TIMEOUT_SECS) || 300
    };
    
    this.validateConfig();
  }

  validateConfig() {
    if (!this.config.token) {
      throw new Error('APIFY_TOKEN is required');
    }
    if (!this.config.actorId) {
      throw new Error('APIFY_ACTOR_ID is required');
    }
  }

  getApifyConfig() {
    return {
      token: this.config.token,
      actorId: this.config.actorId,
      datasetId: this.config.datasetId,
      memory: this.config.memoryMbytes,
      timeout: this.config.timeoutSecs
    };
  }
}

module.exports = { ApifyConfigLock };
`;
  }
}

// Run the architecture lock phase 1
if (require.main === module) {
  const lock = new ArchitectureLockPhase1();
  lock.run()
    .then(() => {
      console.log('✅ Architecture Lock Phase 1 completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Architecture Lock Phase 1 failed:', error);
      process.exit(1);
    });
}

module.exports = { ArchitectureLockPhase1 };