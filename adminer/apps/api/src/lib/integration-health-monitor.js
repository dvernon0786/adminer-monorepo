
// Integration Health Monitoring - Architecture Lock Phase 2
// This file monitors the health of all service integrations

class IntegrationHealthMonitor {
  constructor() {
    this.services = {
      clerk: { name: 'Clerk Authentication', status: 'unknown' },
      neon: { name: 'Neon Database', status: 'unknown' },
      dodo: { name: 'Dodo Payments', status: 'unknown' },
      inngest: { name: 'Inngest Background Jobs', status: 'unknown' },
      apify: { name: 'Apify Web Scraping', status: 'unknown' }
    };
  }

  async checkAllServices() {
    console.log('🔍 INTEGRATION_HEALTH_CHECK_LOCK', {
      timestamp: new Date().toISOString(),
      services: Object.keys(this.services)
    });

    const results = {};
    
    for (const [serviceName, serviceInfo] of Object.entries(this.services)) {
      try {
        results[serviceName] = await this.checkService(serviceName);
        this.services[serviceName].status = results[serviceName].healthy ? 'healthy' : 'unhealthy';
      } catch (error) {
        results[serviceName] = { healthy: false, error: error.message };
        this.services[serviceName].status = 'error';
      }
    }

    return results;
  }

  async checkService(serviceName) {
    switch (serviceName) {
      case 'clerk':
        return await this.checkClerkHealth();
      case 'neon':
        return await this.checkNeonHealth();
      case 'dodo':
        return await this.checkDodoHealth();
      case 'inngest':
        return await this.checkInngestHealth();
      case 'apify':
        return await this.checkApifyHealth();
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  async checkClerkHealth() {
    // Check if Clerk environment variables are configured
    const hasPublishableKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
    
    return {
      healthy: hasPublishableKey && hasSecretKey,
      details: {
        publishableKey: hasPublishableKey,
        secretKey: hasSecretKey
      }
    };
  }

  async checkNeonHealth() {
    // Check if Neon database connection is configured
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    return {
      healthy: hasDatabaseUrl,
      details: {
        databaseUrl: hasDatabaseUrl
      }
    };
  }

  async checkDodoHealth() {
    // Check if Dodo Payments is configured
    const hasApiKey = !!process.env.DODO_API_KEY;
    const hasSecretKey = !!process.env.DODO_SECRET_KEY;
    const hasMode = !!process.env.DODO_MODE;
    
    return {
      healthy: hasApiKey && hasSecretKey && hasMode,
      details: {
        apiKey: hasApiKey,
        secretKey: hasSecretKey,
        mode: hasMode
      }
    };
  }

  async checkInngestHealth() {
    // Check if Inngest is configured
    const hasEventKey = !!process.env.INNGEST_EVENT_KEY;
    const hasSigningKey = !!process.env.INNGEST_SIGNING_KEY;
    
    return {
      healthy: hasEventKey && hasSigningKey,
      details: {
        eventKey: hasEventKey,
        signingKey: hasSigningKey
      }
    };
  }

  async checkApifyHealth() {
    // Check if Apify is configured
    const hasToken = !!process.env.APIFY_TOKEN;
    const hasActorId = !!process.env.APIFY_ACTOR_ID;
    
    return {
      healthy: hasToken && hasActorId,
      details: {
        token: hasToken,
        actorId: hasActorId
      }
    };
  }

  getServiceStatus() {
    return this.services;
  }
}

module.exports = { IntegrationHealthMonitor };
