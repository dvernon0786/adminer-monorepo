
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
      'DATABASE_URL': /^postgresql://.+/,
      'DODO_MODE': /^(test|live)$/,
      'DODO_API_BASE': /^https://[a-zA-Z0-9.-]+$/,
      'DODO_API_KEY': /^dodo_(test_|live_)[A-Za-z0-9]+$/,
      'DODO_SECRET_KEY': /^dodo_(test_|live_)[A-Za-z0-9]+$/,
      'INNGEST_EVENT_KEY': /^evt_[A-Za-z0-9]+$/,
      'INNGEST_SIGNING_KEY': /^signkey_[A-Za-z0-9]+$/,
      'APIFY_TOKEN': /^apify_api_[A-Za-z0-9]+$/,
      'NEXT_PUBLIC_APP_URL': /^https?://[a-zA-Z0-9.-]+$/,
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
          errors.push(`Missing required ${service} variable: ${varName}`);
        } else if (this.patterns[varName] && !this.patterns[varName].test(process.env[varName])) {
          warnings.push(`Invalid format for ${varName}: ${process.env[varName]}`);
        }
      }
    }

    // Log results
    if (errors.length > 0) {
      console.error('❌ ENVIRONMENT VALIDATION FAILED:');
      errors.forEach(error => console.error(`   - ${error}`));
      throw new Error(`Environment validation failed: ${errors.length} errors`);
    }

    if (warnings.length > 0) {
      console.warn('⚠️ ENVIRONMENT VALIDATION WARNINGS:');
      warnings.forEach(warning => console.warn(`   - ${warning}`));
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
