import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Apify client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN,
});

export interface ScrapeInput {
  keyword: string;
  limit: number;
  country?: string;
  language?: string;
}

export interface ScrapeResult {
  type: 'scrape';
  keyword: string;
  limit: number;
  pagesScraped: number;
  dataExtracted: number;
  processingTime: number;
  status: 'completed' | 'failed';
  data: any[];
  error?: string;
  runId?: string;
  defaultDatasetId?: string;
}

export class ApifyService {
  private client: ApifyClient;
  private defaultActorId: string;

  constructor() {
    this.client = apifyClient;
    this.defaultActorId = process.env.APIFY_ACTOR_ID || 'apify/google-search-scraper';
  }

  /**
   * Run a scraping job using Apify actor
   * Based on: https://docs.apify.com/api/v2/act-run-sync-get-dataset-items-post
   */
  async runScrapeJob(input: ScrapeInput): Promise<ScrapeResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting Apify scrape job:', input);

      // Prepare actor input
      const actorInput = {
        queries: [input.keyword],
        maxResults: input.limit,
        country: input.country || 'US',
        language: input.language || 'en',
        resultsPerPage: Math.min(input.limit, 10), // Max 10 per page
        includeUnfilteredResults: false,
        saveHtml: false,
        saveHtmlToKeyValueStore: false,
        customMapFunction: undefined,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL'],
        }
      };

      console.log('Actor input prepared:', actorInput);

      // Run actor synchronously and get dataset items
      // Using the API endpoint: POST /v2/acts/:actorId/run-sync-get-dataset-items
      const response = await this.client.actor(this.defaultActorId).call(actorInput, {
        waitSecs: 300, // Wait up to 5 minutes
        memory: 1024,  // 1GB memory
        timeout: 300,  // 5 minute timeout
      });

      console.log('Apify run completed:', {
        runId: response.defaultDatasetId,
        status: response.status,
        stats: response.stats
      });

      // Get dataset items
      const datasetItems = await this.client.dataset(response.defaultDatasetId).listItems({
        limit: input.limit,

      });

      const processingTime = Date.now() - startTime;
      const dataExtracted = datasetItems.items.length;

      console.log('Dataset items retrieved:', {
        count: dataExtracted,
        processingTime
      });

      return {
        type: 'scrape',
        keyword: input.keyword,
        limit: input.limit,
        pagesScraped: Math.ceil(dataExtracted / 10), // Estimate pages based on results
        dataExtracted,
        processingTime,
        status: 'completed',
        data: datasetItems.items
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Apify scrape job failed:', error);

      return {
        type: 'scrape',
        keyword: input.keyword,
        limit: input.limit,
        pagesScraped: 0,
        dataExtracted: 0,
        processingTime,
        status: 'failed',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run actor asynchronously (for long-running jobs)
   */
  async runScrapeJobAsync(input: ScrapeInput): Promise<{ runId: string; status: string }> {
    try {
      console.log('Starting async Apify scrape job:', input);

      const actorInput = {
        queries: [input.keyword],
        maxResults: input.limit,
        country: input.country || 'US',
        language: input.language || 'en',
        resultsPerPage: Math.min(input.limit, 10),
        includeUnfilteredResults: false,
        saveHtml: false,
        saveHtmlToKeyValueStore: false,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL'],
        }
      };

      // Start the run asynchronously
      const run = await this.client.actor(this.defaultActorId).call(actorInput, {
        waitSecs: 0, // Don't wait, return immediately
        memory: 1024,
        timeout: 600, // 10 minute timeout for async
      });

      console.log('Async Apify run started:', {
        runId: run.id,
        status: run.status
      });

      return {
        runId: run.id,
        status: run.status
      };

    } catch (error) {
      console.error('Failed to start async Apify run:', error);
      throw error;
    }
  }

  /**
   * Get run status and results
   */
  async getRunResults(runId: string, limit: number = 100): Promise<any[]> {
    try {
      const run = await this.client.run(runId).get();
      
      if (run.status !== 'SUCCEEDED') {
        throw new Error(`Run ${runId} is not completed. Status: ${run.status}`);
      }

      // Get dataset items
      const datasetItems = await this.client.dataset(run.defaultDatasetId).listItems({
        limit,

      });

      return datasetItems.items;

    } catch (error) {
      console.error('Failed to get run results:', error);
      throw error;
    }
  }

  /**
   * Check if Apify is properly configured
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      if (!process.env.APIFY_TOKEN && !process.env.APIFY_API_TOKEN) {
        return {
          status: 'error',
          message: 'APIFY_TOKEN not configured'
        };
      }

      if (!this.defaultActorId) {
        return {
          status: 'error',
          message: 'APIFY_ACTOR_ID not configured'
        };
      }

      // Try to get actor info to verify connection
      const actor = await this.client.actor(this.defaultActorId).get();
      
      return {
        status: 'healthy',
        message: `Connected to Apify. Actor: ${actor.name} (${actor.id})`
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Apify connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const apifyService = new ApifyService();