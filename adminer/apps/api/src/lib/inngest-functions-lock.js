
// Inngest Background Jobs Functions Lock - Architecture Lock Phase 2
// This file locks the working Inngest function patterns

class InngestFunctionsLock {
  constructor() {
    this.functionPatterns = this.initializeFunctionPatterns();
  }

  initializeFunctionPatterns() {
    return {
      // Lock the working scraping function
      scrapeAds: {
        name: 'scrape-ads',
        trigger: 'scrape.triggered',
        steps: [
          'validate-input',
          'call-apify',
          'process-results',
          'update-database',
          'send-notification'
        ]
      },
      
      // Lock the working quota update function
      updateQuota: {
        name: 'update-quota',
        trigger: 'quota.updated',
        steps: [
          'validate-org',
          'update-quota-limit',
          'reset-quota-used',
          'log-change'
        ]
      },
      
      // Lock the working plan upgrade function
      upgradePlan: {
        name: 'upgrade-plan',
        trigger: 'plan.upgraded',
        steps: [
          'validate-subscription',
          'update-organization',
          'reset-quota',
          'send-confirmation'
        ]
      }
    };
  }

  getFunctionPatterns() {
    return this.functionPatterns;
  }
}

module.exports = { InngestFunctionsLock };
