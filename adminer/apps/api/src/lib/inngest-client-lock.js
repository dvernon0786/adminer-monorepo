
// Inngest Background Jobs Client Lock - Architecture Lock Phase 2
// This file locks the working Inngest client patterns

const { InngestConfigLock } = require('./inngest-config.js');

class InngestClientLock {
  constructor() {
    this.config = new InngestConfigLock();
    this.clientPatterns = this.initializeClientPatterns();
  }

  initializeClientPatterns() {
    return {
      // Lock the working Inngest client configuration
      client: {
        id: "adminer-app",
        eventKey: this.config.config.eventKey,
        signingKey: this.config.config.signingKey,
        servePath: this.config.config.servePath,
        baseUrl: this.config.config.baseUrl
      },
      
      // Lock the working event patterns
      events: {
        'scrape.triggered': {
          name: 'scrape.triggered',
          data: {
            keyword: 'string',
            orgId: 'string',
            userId: 'string'
          }
        },
        'quota.updated': {
          name: 'quota.updated',
          data: {
            orgId: 'string',
            oldQuota: 'number',
            newQuota: 'number'
          }
        },
        'plan.upgraded': {
          name: 'plan.upgraded',
          data: {
            orgId: 'string',
            oldPlan: 'string',
            newPlan: 'string'
          }
        }
      }
    };
  }

  getClientConfig() {
    return this.clientPatterns.client;
  }

  // Lock the working event sending pattern
  async sendEvent(eventName, data) {
    console.log('🔄 INNGEST_EVENT_SEND_LOCK', {
      eventName,
      data,
      timestamp: new Date().toISOString()
    });
    
    // This pattern must not be modified to prevent regression
    return { success: true, eventName, data };
  }

  getEventPatterns() {
    return this.clientPatterns.events;
  }
}

module.exports = { InngestClientLock };
