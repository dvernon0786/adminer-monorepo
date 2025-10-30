/**
 * DELAY PROCESSOR FOR AI ANALYSIS
 * Uses 20-second delays between API calls to stay within rate limits
 * Based on Pipedream and Zapier sequential processing patterns
 */

const { rateLimiter } = require('./rate-limiter.js');

class DelayProcessor {
  constructor() {
    this.delayBetweenCalls = 8000; // 8 seconds between API calls (reduced from 20s to prevent timeout)
    this.maxRetries = 3;
  }

  /**
   * Process ads with 8-second delays between API calls (reduced from 20s to prevent timeout)
   * Uses Inngest step.sleep for efficient delay management
   */
  async processAdsWithDelays(adsData, analyzer, step = null) {
    const delaySeconds = Math.ceil(this.delayBetweenCalls / 1000);
    console.log(`🔄 Processing ${adsData.length} ads with ${delaySeconds}-second delays between API calls`);
    
    const results = {
      textOnly: [],
      textWithImage: [],
      textWithVideo: [],
      mixed: [],
      skipped: [],
      errors: []
    };

    // Process ads one by one with 20-second delays
    for (let i = 0; i < adsData.length; i++) {
      const ad = adsData[i];
      
      try {
        console.log(`📊 Processing ad ${i + 1}/${adsData.length}: ${ad.ad_archive_id}`);
        
        // Check rate limits before processing
        const contentType = analyzer.detectContentType(ad);
        const canProcess = await this.checkRateLimits(contentType);
        
        if (!canProcess.canMake) {
          console.log(`⏳ Rate limit reached, waiting ${Math.ceil(canProcess.waitTime / 1000)}s...`);
          
          // Use Inngest delay if available, otherwise fallback to sleep
          if (step) {
            await step.sleep(`rate-limit-wait-${i}`, `${Math.ceil(canProcess.waitTime / 1000)}s`);
          } else {
            await this.sleep(canProcess.waitTime);
          }
        }

        // Process the ad
        const analysisResult = await this.processSingleAd(ad, analyzer, contentType);
        
        // Store result based on content type
        const resultKey = this.getResultKey(contentType);
        results[resultKey].push(analysisResult);
        
        // Record the API usage
        this.recordUsage(contentType, analysisResult);
        
        // 8-second delay between ads using Inngest step.sleep (reduced from 20s to prevent timeout)
        if (i < adsData.length - 1) {
          const delaySeconds = Math.ceil(this.delayBetweenCalls / 1000);
          console.log(`⏳ Waiting ${delaySeconds} seconds before processing next ad...`);
          if (step) {
            await step.sleep(`rate-limit-spacing-${i}`, `${delaySeconds}s`);
          } else {
            await this.sleep(this.delayBetweenCalls);
          }
        }
        
      } catch (error) {
        // Enhanced error logging with full details
        const errorInfo = {
          ad_archive_id: ad.ad_archive_id,
          error: error.message,
          contentType: analyzer.detectContentType(ad),
          errorDetails: error.errorDetails || [],
          stack: error.stack?.substring(0, 500), // Limit stack trace length
          status: error.status || error.response?.status,
          name: error.name
        };
        
        console.error(`❌ Error processing ad ${ad.ad_archive_id}:`, errorInfo);
        results.errors.push(errorInfo);
      }
    }

    return results;
  }

  /**
   * Check rate limits for a specific content type
   */
  async checkRateLimits(contentType) {
    let provider, model, estimatedTokens;

    switch (contentType) {
      case 'text_with_image':
        // GPT-4o for image analysis + GPT-4o-mini for strategic analysis
        const imageCheck = rateLimiter.canMakeRequest('openai', 'gpt4o', 1000);
        if (!imageCheck.canMake) return imageCheck;
        
        const strategicCheck = rateLimiter.canMakeRequest('openai', 'gpt4oMini', 1000);
        if (!strategicCheck.canMake) return strategicCheck;
        
        return { canMake: true };
        
      case 'text_with_video':
        // Gemini for video analysis + GPT-4o-mini for strategic analysis
        const videoCheck = rateLimiter.canMakeRequest('gemini', 'flash', 1000);
        if (!videoCheck.canMake) return videoCheck;
        
        const videoStrategicCheck = rateLimiter.canMakeRequest('openai', 'gpt4oMini', 1000);
        if (!videoStrategicCheck.canMake) return videoStrategicCheck;
        
        return { canMake: true };
        
      default:
        // GPT-4o-mini for text-only analysis
        return rateLimiter.canMakeRequest('openai', 'gpt4oMini', 1000);
    }
  }

  /**
   * Process a single ad with retry logic
   */
  async processSingleAd(ad, analyzer, contentType) {
    let lastError;
    const errorDetails = [];
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        let analysisResult;
        
        switch (contentType) {
          case 'text_only':
            analysisResult = await analyzer.analyzeTextOnly(ad);
            break;
          case 'text_with_image':
            analysisResult = await analyzer.analyzeTextWithImage(ad);
            break;
          case 'text_with_video':
            analysisResult = await analyzer.analyzeTextWithVideo(ad);
            break;
          default:
            analysisResult = await analyzer.analyzeTextOnly(ad);
        }

        return {
          ...ad,
          analysis: analysisResult,
          analysisType: contentType,
          contentType: contentType
        };
        
      } catch (error) {
        lastError = error;
        
        // Enhanced error logging with full details
        const errorDetail = {
          attempt,
          error: error.message,
          stack: error.stack,
          name: error.name,
          status: error.status || error.response?.status,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : null
        };
        errorDetails.push(errorDetail);
        
        console.error(`❌ Attempt ${attempt}/${this.maxRetries} failed for ad ${ad.ad_archive_id}:`, {
          message: error.message,
          status: error.status || error.response?.status,
          name: error.name,
          contentType
        });
        
        if (error.stack) {
          console.error(`   Stack trace: ${error.stack.substring(0, 500)}`);
        }
        
        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    // Attach error details to the error for better debugging
    if (lastError) {
      lastError.errorDetails = errorDetails;
      lastError.adArchiveId = ad.ad_archive_id;
      lastError.contentType = contentType;
    }
    
    throw lastError;
  }

  /**
   * Record API usage for rate limiting
   */
  recordUsage(contentType, analysisResult) {
    // Estimate tokens used based on content type
    switch (contentType) {
      case 'text_with_image':
        // GPT-4o (image) + GPT-4o-mini (strategic)
        rateLimiter.recordRequest('openai', 'gpt4o', 1000);
        rateLimiter.recordRequest('openai', 'gpt4oMini', 1000);
        break;
      case 'text_with_video':
        // Gemini (video) + GPT-4o-mini (strategic)
        rateLimiter.recordRequest('gemini', 'flash', 1000);
        rateLimiter.recordRequest('openai', 'gpt4oMini', 1000);
        break;
      default:
        // GPT-4o-mini only
        rateLimiter.recordRequest('openai', 'gpt4oMini', 1000);
    }
  }

  /**
   * Get result key based on content type
   */
  getResultKey(contentType) {
    switch (contentType) {
      case 'text_only': return 'textOnly';
      case 'text_with_image': return 'textWithImage';
      case 'text_with_video': return 'textWithVideo';
      default: return 'textOnly';
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    return {
      openai: rateLimiter.getUsageStats('openai'),
      gemini: rateLimiter.getUsageStats('gemini')
    };
  }

  /**
   * Calculate processing time for ads
   */
  calculateProcessingTime(adsCount) {
    const delayPerAd = this.delayBetweenCalls / 1000; // Convert to seconds
    const totalDelay = (adsCount - 1) * delayPerAd; // Don't delay after last ad
    const processingTime = adsCount * 5; // Assume 5 seconds per ad processing
    const totalTime = totalDelay + processingTime;
    
    return {
      delayPerAd: delayPerAd,
      totalDelay: totalDelay,
      processingTime: processingTime,
      totalTime: totalTime,
      estimatedMinutes: Math.ceil(totalTime / 60)
    };
  }
}

module.exports = { DelayProcessor };