
// Clerk Authentication Flow Lock - Architecture Lock Phase 2
// This file locks the working Clerk authentication patterns to prevent regression

const { ClerkConfigLock } = require('./clerk-config.js');

class ClerkAuthFlowLock {
  constructor() {
    this.config = new ClerkConfigLock();
    this.authPatterns = this.initializeAuthPatterns();
  }

  initializeAuthPatterns() {
    return {
      // Lock the working authentication flow
      signIn: {
        redirectUrl: '/dashboard',
        afterSignInUrl: '/dashboard',
        afterSignUpUrl: '/dashboard'
      },
      
      // Lock the working user session handling
      session: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60,    // 24 hours
        absolute: false
      },
      
      // Lock the working organization handling
      organization: {
        createOrganizationUrl: '/dashboard',
        afterCreateOrganizationUrl: '/dashboard',
        afterLeaveOrganizationUrl: '/dashboard'
      }
    };
  }

  getAuthConfig() {
    const baseConfig = this.config.getAuthConfig();
    return {
      ...baseConfig,
      ...this.authPatterns
    };
  }

  // Lock the working webhook handling pattern
  getWebhookConfig() {
    return {
      webhookSecret: this.config.config.webhookSecret,
      events: [
        'user.created',
        'user.updated',
        'user.deleted',
        'organization.created',
        'organization.updated',
        'organization.deleted',
        'session.created',
        'session.ended'
      ],
      handler: '/api/clerk/webhook'
    };
  }

  // Lock the working component patterns
  getComponentConfig() {
    return {
      signInButton: {
        mode: 'modal',
        appearance: {
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        }
      },
      signUpButton: {
        mode: 'modal',
        appearance: {
          elements: {
            formButtonPrimary: 'bg-green-600 hover:bg-green-700 text-white'
          }
        }
      },
      userButton: {
        appearance: {
          elements: {
            avatarBox: 'w-8 h-8'
          }
        }
      }
    };
  }
}

module.exports = { ClerkAuthFlowLock };
