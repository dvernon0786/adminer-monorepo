/**
 * RATE LIMITER FOR AI API CALLS
 * Handles rate limiting for OpenAI and Gemini APIs within free tier constraints
 */

class RateLimiter {
  constructor() {
    // Rate limits based on free tier constraints
    this.limits = {
      openai: {
        gpt4o: { rpm: 3, tpm: 40000, rpd: 200 },
        gpt4oMini: { rpm: 3, tpm: 40000, rpd: 200 }
      },
      gemini: {
        flash: { rpm: 15, tpm: 1000000, rpd: 1500 }
      }
    };
    
    // Track usage
    this.usage = {
      openai: { requests: [], tokens: [] },
      gemini: { requests: [], tokens: [] }
    };
  }

  /**
   * Check if we can make a request without hitting rate limits
   */
  canMakeRequest(provider, model, estimatedTokens = 1000) {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const limits = this.limits[provider][model];
    const usage = this.usage[provider];

    // Clean old entries
    this.cleanOldEntries(provider, now);

    // Check RPM limit
    const recentRequests = usage.requests.filter(time => now - time < oneMinute);
    if (recentRequests.length >= limits.rpm) {
      return { canMake: false, reason: 'RPM_LIMIT', waitTime: oneMinute - (now - recentRequests[0]) };
    }

    // Check TPM limit
    const recentTokens = usage.tokens.filter(entry => now - entry.time < oneMinute);
    const totalRecentTokens = recentTokens.reduce((sum, entry) => sum + entry.tokens, 0);
    if (totalRecentTokens + estimatedTokens > limits.tpm) {
      return { canMake: false, reason: 'TPM_LIMIT', waitTime: oneMinute - (now - recentTokens[0].time) };
    }

    // Check RPD limit
    const dailyRequests = usage.requests.filter(time => now - time < oneDay);
    if (dailyRequests.length >= limits.rpd) {
      return { canMake: false, reason: 'RPD_LIMIT', waitTime: oneDay - (now - dailyRequests[0]) };
    }

    return { canMake: true };
  }

  /**
   * Record a successful API call
   */
  recordRequest(provider, model, actualTokens = 1000) {
    const now = Date.now();
    this.usage[provider].requests.push(now);
    this.usage[provider].tokens.push({ time: now, tokens: actualTokens });
  }

  /**
   * Clean old entries to prevent memory leaks
   */
  cleanOldEntries(provider, now) {
    const oneDay = 24 * 60 * 60 * 1000;
    this.usage[provider].requests = this.usage[provider].requests.filter(time => now - time < oneDay);
    this.usage[provider].tokens = this.usage[provider].tokens.filter(entry => now - entry.time < oneDay);
  }

  /**
   * Get wait time for next request
   */
  getWaitTime(provider, model) {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    const usage = this.usage[provider];
    const recentRequests = usage.requests.filter(time => now - time < oneMinute);
    
    if (recentRequests.length > 0) {
      return Math.max(0, oneMinute - (now - recentRequests[0]));
    }
    
    return 0;
  }

  /**
   * Get current usage stats
   */
  getUsageStats(provider) {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const usage = this.usage[provider];
    const recentRequests = usage.requests.filter(time => now - time < oneMinute);
    const dailyRequests = usage.requests.filter(time => now - time < oneDay);
    const recentTokens = usage.tokens.filter(entry => now - entry.time < oneMinute);
    const totalRecentTokens = recentTokens.reduce((sum, entry) => sum + entry.tokens, 0);

    return {
      rpm: recentRequests.length,
      rpd: dailyRequests.length,
      tpm: totalRecentTokens,
      lastRequest: usage.requests.length > 0 ? usage.requests[usage.requests.length - 1] : null
    };
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

module.exports = { RateLimiter, rateLimiter };