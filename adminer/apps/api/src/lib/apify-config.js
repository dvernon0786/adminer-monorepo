
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
