
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
