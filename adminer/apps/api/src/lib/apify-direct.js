// DIRECT APIFY API INTEGRATION - ENHANCED VERSION
// Based on: https://docs.apify.com/api/v2#/reference/actors/run-actor-synchronously-and-get-dataset-items

const fetch = require('node-fetch');

class ApifyDirectService {
  constructor() {
    this.apiToken = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
    this.actorId = process.env.APIFY_ACTOR_ID || 'apify/google-search-scraper';
    this.baseUrl = 'https://api.apify.com/v2';
    
    if (!this.apiToken) {
      console.warn('⚠️ APIFY_TOKEN not found in environment variables');
    }
  }

  /**
   * Run a scraping job using direct Apify API calls
   * Uses the synchronous endpoint for immediate results
   */
  async runScrapeJob(input) {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting direct Apify scrape job:', input);

      if (!this.apiToken) {
        throw new Error('APIFY_TOKEN environment variable not set');
      }

      // Prepare actor input based on the actual actor type
      let actorInput;
      
      if (this.actorId === 'apify/google-search-scraper') {
        // Google Search Scraper input format
        actorInput = {
          queries: [input.keyword],
          maxResults: input.limit || 10,
          countryCode: input.country || 'US',
          languageCode: input.language || 'en',
          resultsPerPage: Math.min(input.limit || 10, 10),
          includeUnfilteredResults: false,
          saveHtml: false,
          saveHtmlToKeyValueStore: false,
          customMapFunction: undefined,
          proxy: {
            useApifyProxy: true,
            apifyProxyGroups: ['RESIDENTIAL'],
          }
        };
      } else {
        // Facebook Ads Library Scraper input format (current actor)
        // Use correct format with urls array of objects
        const facebookUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${input.country || 'US'}&q=${encodeURIComponent(input.keyword)}&search_type=keyword_unordered&media_type=all`;
        
        actorInput = {
          count: input.limit || 10,
          scrapeAdDetails: false,
          "scrapePageAds.activeStatus": "all",
          "scrapePageAds.countryCode": input.country || 'US',
          urls: [
            {
              url: facebookUrl,
              method: "GET"
            }
          ]
        };
      }

      console.log('📋 Actor input prepared:', actorInput);

      // Use the synchronous endpoint for immediate results
      const url = `${this.baseUrl}/acts/${this.actorId}/run-sync-get-dataset-items`;
      
      console.log('🌐 Calling Apify API:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(actorInput),
        timeout: 300000, // 5 minutes timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Apify API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Apify API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Apify API response received:', {
        hasData: !!result.data,
        itemCount: result.data?.items?.length || 0,
        runId: result.data?.runId
      });

      const processingTime = Date.now() - startTime;
      const dataExtracted = result.data?.items?.length || 0;

      console.log('📊 Scraping completed:', {
        keyword: input.keyword,
        dataExtracted,
        processingTime: `${processingTime}ms`
      });

      return {
        type: 'scrape',
        keyword: input.keyword,
        limit: input.limit || 10,
        pagesScraped: Math.ceil(dataExtracted / 10),
        dataExtracted,
        processingTime,
        status: 'completed',
        data: result.data?.items || [],
        runId: result.data?.runId,
        defaultDatasetId: result.data?.defaultDatasetId
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Direct Apify scrape job failed:', error);

      return {
        type: 'scrape',
        keyword: input.keyword,
        limit: input.limit || 10,
        pagesScraped: 0,
        dataExtracted: 0,
        processingTime,
        status: 'failed',
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Health check for Apify service
   */
  async healthCheck() {
    try {
      if (!this.apiToken) {
        return {
          status: 'error',
          message: 'APIFY_TOKEN not configured'
        };
      }

      if (!this.actorId) {
        return {
          status: 'error',
          message: 'APIFY_ACTOR_ID not configured'
        };
      }

      // Test API connectivity with a simple request
      const url = `${this.baseUrl}/acts/${this.actorId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
        timeout: 10000, // 10 seconds for health check
      });

      if (response.ok) {
        const actorInfo = await response.json();
        return {
          status: 'healthy',
          message: `Connected to Apify. Actor: ${actorInfo.data?.name || 'Unknown'} (${this.actorId})`
        };
      } else {
        return {
          status: 'error',
          message: `Apify API error: ${response.status} ${response.statusText}`
        };
      }

    } catch (error) {
      return {
        status: 'error',
        message: `Apify connection failed: ${error.message}`
      };
    }
  }

  /**
   * Test scraping with a simple query
   */
  async testScraping() {
    try {
      console.log('🧪 Testing Apify scraping with sample query...');
      
      const testInput = {
        keyword: 'mortgage',
        limit: 3
      };

      const result = await this.runScrapeJob(testInput);
      
      console.log('🧪 Test scraping result:', {
        status: result.status,
        dataExtracted: result.dataExtracted,
        processingTime: result.processingTime,
        hasData: result.data.length > 0
      });

      return result;

    } catch (error) {
      console.error('❌ Test scraping failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
const apifyDirectService = new ApifyDirectService();
module.exports = { ApifyDirectService, apifyDirectService };