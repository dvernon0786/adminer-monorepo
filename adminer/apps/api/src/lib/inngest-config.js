
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
