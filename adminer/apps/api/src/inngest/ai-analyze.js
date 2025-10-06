/**
 * AI ANALYSIS INNGEST HANDLER
 * Processes scraped Apify data with unified AI analysis
 */

const { inngest } = require('./client.js');
const { neon } = require('@neondatabase/serverless');
const { 
  UnifiedApifyAnalyzer, 
  extractSummary, 
  extractRewrittenCopy, 
  extractKeyInsights, 
  extractCompetitorStrategy, 
  extractRecommendations, 
  getAIModelsUsed 
} = require('../lib/unified-ai-analyzer.js');

const database = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// AI Analysis Handler
const aiAnalyze = inngest.createFunction(
  { id: "ai-analyze" },
  { event: "ai/analyze.start" },
  async ({ event, step }) => {
    console.log("🔥 AI ANALYSIS FUNCTION TRIGGERED!", { 
      eventData: event.data,
      timestamp: new Date().toISOString(),
      eventName: event.name
    });
    
    try {
      const { jobId, scraped_data, orgId } = event.data;
      
      console.log(`🤖 AI Analysis started for job ${jobId} with ${scraped_data?.dataExtracted || 0} ads`);
      console.log(`📊 AI Analysis event data:`, JSON.stringify(event.data, null, 2));
      console.log(`🔗 Database URL available:`, !!process.env.DATABASE_URL);
      console.log(`🔗 Database client:`, !!database);

      if (!database) {
        console.log("⚠️ Database not available, AI analysis processed locally only");
        return { success: true, jobId, orgId, note: "database unavailable" };
      }

      if (!jobId || !orgId || !scraped_data) {
        throw new Error(`Missing required data: jobId=${jobId}, orgId=${orgId}, scraped_data=${!!scraped_data}`);
      }
      // Step 1: Update job status to running
      await step.run('update-job-status', async () => {
        await database.query(`
          UPDATE jobs 
          SET status = $1, started_at = NOW(), updated_at = NOW()
          WHERE id = $2
        `, ['running', jobId]);
        
        console.log(`✅ Job status updated to 'running': ${jobId}`);
        return { status: 'running' };
      });

      // Step 2: Process with unified analyzer
      const analysisResults = await step.run('process-ads-with-ai', async () => {
        const analyzer = new UnifiedApifyAnalyzer();
        
        // Extract ads data from scraped_data
        const adsData = scraped_data.data || scraped_data.results || [];
        
        if (!Array.isArray(adsData) || adsData.length === 0) {
          throw new Error('No ads data found in scraped_data');
        }

        console.log(`🔄 Processing ${adsData.length} ads with AI analysis using 20-second delays...`);
        return await analyzer.processApifyData(adsData, step);
      });

      // Step 3: Store results in database
      await step.run('store-analysis-results', async () => {
        const { results } = analysisResults;
        const allAnalyzedAds = [
          ...results.textOnly,
          ...results.textWithImage, 
          ...results.textWithVideo,
          ...results.mixed
        ];

        console.log(`💾 Storing ${allAnalyzedAds.length} analyzed ads in database...`);

        for (const analyzedAd of allAnalyzedAds) {
          try {
            // Parse analysis results
            const analysis = analyzedAd.analysis;
            const summary = extractSummary(analysis);
            const rewrittenCopy = extractRewrittenCopy(analysis);
            const keyInsights = extractKeyInsights(analysis);
            const competitorStrategy = extractCompetitorStrategy(analysis);
            const recommendations = extractRecommendations(analysis);
            const aiModelsUsed = getAIModelsUsed(analyzedAd.contentType);

            // Update job with AI analysis results
            await database.query(`
              UPDATE jobs 
              SET 
                content_type = $1,
                text_analysis = $2,
                image_analysis = $3,
                video_analysis = $4,
                combined_analysis = $5,
                summary = $6,
                rewritten_ad_copy = $7,
                key_insights = $8,
                competitor_strategy = $9,
                recommendations = $10,
                processing_stats = $11,
                status = $12,
                completed_at = NOW(),
                updated_at = NOW()
              WHERE id = $13
            `, [
              analyzedAd.contentType,
              JSON.stringify(analysis.step2_strategic_analysis || analysis),
              JSON.stringify(analysis.step1_image_analysis || null),
              JSON.stringify(analysis.step1_video_analysis || null),
              JSON.stringify(analysis.combined_analysis || null),
              summary,
              rewrittenCopy,
              JSON.stringify(keyInsights),
              competitorStrategy,
              JSON.stringify(recommendations),
              JSON.stringify({
                contentType: analyzedAd.contentType,
                processingTime: new Date().toISOString(),
                aiModelsUsed: aiModelsUsed,
                adArchiveId: analyzedAd.ad_archive_id
              }),
              'completed',
              jobId
            ]);

            console.log(`✅ Stored analysis for ad ${analyzedAd.ad_archive_id} (${analyzedAd.contentType})`);

          } catch (storeError) {
            console.error(`❌ Failed to store analysis for ad ${analyzedAd.ad_archive_id}:`, storeError);
            // Continue with other ads
          }
        }

        return { stored: allAnalyzedAds.length };
      });

      // Step 4: Update quota consumption
      await step.run('update-quota-consumption', async () => {
        const adsProcessed = analysisResults.stats.processed;
        
        try {
          await database.query(`
            UPDATE organizations 
            SET quota_used = quota_used + $1, updated_at = NOW() 
            WHERE clerk_org_id = $2
          `, [adsProcessed, orgId]);
          
          console.log(`✅ Quota updated for organization: ${orgId} (${adsProcessed} ads analyzed)`);
          
        } catch (quotaError) {
          console.error('⚠️ Failed to update quota:', quotaError);
          // Don't fail the job for quota update errors
        }

        return { quotaConsumed: adsProcessed };
      });

      // Step 5: Final job completion
      await step.run('complete-job', async () => {
        await database.query(`
          UPDATE jobs 
          SET 
            status = $1,
            output = $2,
            completed_at = NOW(),
            updated_at = NOW()
          WHERE id = $3
        `, [
          'completed',
          JSON.stringify({
            totalProcessed: analysisResults.stats.processed,
            contentTypes: {
              textOnly: analysisResults.stats.textOnly,
              textWithImage: analysisResults.stats.textWithImage,
              textWithVideo: analysisResults.stats.textWithVideo,
              mixed: analysisResults.stats.mixed
            },
            skipped: analysisResults.stats.skippedLargeVideos,
            errors: analysisResults.stats.errors,
            summary: `Analyzed ${analysisResults.stats.processed} ads successfully`
          }),
          jobId
        ]);

        console.log(`✅ Job completed successfully: ${jobId}`);
        return { status: 'completed' };
      });

      return { 
        success: true, 
        jobId, 
        orgId,
        status: 'completed',
        resultsProcessed: analysisResults.stats.processed,
        contentTypes: {
          textOnly: analysisResults.stats.textOnly,
          textWithImage: analysisResults.stats.textWithImage,
          textWithVideo: analysisResults.stats.textWithVideo,
          mixed: analysisResults.stats.mixed
        },
        skipped: analysisResults.stats.skippedLargeVideos,
        errors: analysisResults.stats.errors,
        message: 'AI analysis completed successfully'
      };
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      
      // Update job status to failed
      try {
        await database.query(`
          UPDATE jobs 
          SET status = $1, error = $2, updated_at = NOW()
          WHERE id = $3
        `, ['failed', error.message, jobId]);
      } catch (updateError) {
        console.error('❌ Failed to update job status to failed:', updateError);
      }
      
      throw error;
    }
  }
);

module.exports = { aiAnalyze };