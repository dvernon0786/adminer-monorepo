/**
 * AI ANALYSIS INNGEST HANDLER - PRODUCTION VERSION
 * Processes scraped Facebook ads with comprehensive AI analysis
 */

const { inngest } = require('./client.js');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// Production AI Analysis Handler
const aiAnalyze = inngest.createFunction(
  { id: "ai-analyze" },
  { event: "ai/analyze.start" },
  async ({ event, step }) => {
    console.log("🔥 AI ANALYSIS TRIGGERED FOR JOB:", event.data.jobId);
    
    const { jobId, orgId, keyword } = event.data;
    
    // Step 1: Get job data and raw scraped data
    const jobData = await step.run("get-job-data", async () => {
      console.log(`📊 Fetching job data for: ${jobId}`);
      
      const jobResult = await sql`
        SELECT id, raw_data, org_id, status, created_at
        FROM jobs 
        WHERE id = ${jobId}
        LIMIT 1
      `;
      
      if (!jobResult || jobResult.length === 0) {
        throw new Error(`Job not found: ${jobId}`);
      }
      
      const job = jobResult[0];
      console.log(`✅ Job found: ${job.id}, status: ${job.status}`);
      
      return job;
    });
    
    // Step 2: Parse raw data
    const adsData = await step.run("parse-raw-data", async () => {
      if (!jobData.raw_data) {
        throw new Error('No raw data found for analysis');
      }
      
      let scrapedData;
      try {
        scrapedData = typeof jobData.raw_data === 'string' ? JSON.parse(jobData.raw_data) : jobData.raw_data;
      } catch (parseError) {
        console.error('❌ Failed to parse raw data:', parseError);
        throw new Error('Invalid raw data format');
      }
      
      const ads = scrapedData.data || scrapedData.results || [];
      console.log(`📊 Raw data parsed, ads count: ${ads.length}`);
      
      if (!Array.isArray(ads) || ads.length === 0) {
        throw new Error('No ads data found in scraped data');
      }
      
      // TIMEOUT FIX: Limit to 2 ads per invocation to prevent FUNCTION_INVOCATION_TIMEOUT
      // With 5-10s delays and API processing, 2 ads = ~20-30s total, well under limits
      const maxAds = 2;
      const limitedAds = ads.slice(0, maxAds);
      console.log(`🎯 Processing ${limitedAds.length} ads (limited from ${ads.length} total to prevent timeout)`);
      
      return limitedAds;
    });
    
    // Step 3: Process with real AI analysis using UnifiedApifyAnalyzer
    const analysisResults = await step.run("process-ai-analysis", async () => {
      console.log(`🔄 Processing ${adsData.length} ads with AI analysis...`);
      
      const { UnifiedApifyAnalyzer } = require('../lib/unified-ai-analyzer.js');
      const analyzer = new UnifiedApifyAnalyzer();
      
      // Process with AI analysis (step parameter enables Inngest delays)
      const results = await analyzer.processApifyData(adsData, step);
      
      console.log(`✅ AI analysis completed:`, {
        processed: results.stats.processed,
        textOnly: results.stats.textOnly,
        textWithImage: results.stats.textWithImage,
        textWithVideo: results.stats.textWithVideo,
        errors: results.stats.errors
      });
      
      return results;
    });
    
    // Step 4: Store comprehensive AI analysis results
    const adsCount = await step.run("store-analysis-results", async () => {
      console.log(`💾 Storing AI analysis results in database...`);
      
      const { results } = analysisResults;
      const allAnalyzedAds = [
        ...results.textOnly,
        ...results.textWithImage, 
        ...results.textWithVideo,
        ...results.mixed
      ];
      
      console.log(`📊 Preparing to store ${allAnalyzedAds.length} analyzed ads for job ${jobId}`);
      
      // Build comprehensive analysis object with all ads
      const allAnalyses = [];
      let primaryAnalysis = null;
      
      for (const analyzedAd of allAnalyzedAds) {
        try {
          const analysis = analyzedAd.analysis || {};
          
          // Extract key insights from analysis
          const summary = analysis.step2_strategic_analysis?.summary || 
                         analysis.summary || 
                         'AI analysis completed';
          
          const rewrittenCopy = analysis.step2_strategic_analysis?.rewritten_ad_copy || 
                               analysis.rewritten_ad_copy || 
                               'No rewritten copy available';
          
          // Store each ad's analysis
          const adAnalysis = {
            adArchiveId: analyzedAd.ad_archive_id,
            contentType: analyzedAd.contentType,
            textAnalysis: analysis.step2_strategic_analysis || analysis,
            imageAnalysis: analysis.step1_image_analysis || null,
            videoAnalysis: analysis.step1_video_analysis || null,
            combinedAnalysis: analysis.combined_analysis || null,
            summary: summary,
            rewrittenAdCopy: rewrittenCopy,
            keyInsights: analysis.step2_strategic_analysis?.key_insights || [],
            competitorStrategy: analysis.step2_strategic_analysis?.competitor_strategy || '',
            recommendations: analysis.step2_strategic_analysis?.recommendations || [],
            processingStats: {
              contentType: analyzedAd.contentType,
              processingTime: new Date().toISOString(),
              aiModelsUsed: analysis.ai_models_used || [],
              adArchiveId: analyzedAd.ad_archive_id
            }
          };
          
          allAnalyses.push(adAnalysis);
          
          // Use first ad as primary for summary fields
          if (!primaryAnalysis) {
            primaryAnalysis = adAnalysis;
          }
          
          console.log(`✅ Prepared analysis for ad ${analyzedAd.ad_archive_id} (${analyzedAd.contentType})`);
        } catch (storeError) {
          console.error(`❌ Failed to prepare analysis for ad ${analyzedAd.ad_archive_id}:`, storeError);
        }
      }
      
      // Validate that at least one ad was successfully analyzed
      if (!primaryAnalysis || allAnalyses.length === 0) {
        const errorMsg = `All ads failed AI analysis for job: ${jobId}`;
        console.error(`❌ ${errorMsg}`);
        
        // Update job status to failed
        await sql`
          UPDATE jobs 
          SET 
            status = 'failed',
            error = ${errorMsg},
            updated_at = NOW()
          WHERE id = ${jobId}
        `;
        
        throw new Error(errorMsg);
      }
      
      // Single UPDATE to store all analyses
      await sql`
        UPDATE jobs 
        SET 
          content_type = ${primaryAnalysis.contentType},
          text_analysis = ${JSON.stringify(primaryAnalysis.textAnalysis)},
          image_analysis = ${JSON.stringify(primaryAnalysis.imageAnalysis)},
          video_analysis = ${JSON.stringify(primaryAnalysis.videoAnalysis)},
          combined_analysis = ${JSON.stringify(primaryAnalysis.combinedAnalysis)},
          summary = ${primaryAnalysis.summary},
          rewritten_ad_copy = ${primaryAnalysis.rewrittenAdCopy},
          key_insights = ${JSON.stringify(primaryAnalysis.keyInsights)},
          competitor_strategy = ${primaryAnalysis.competitorStrategy},
          recommendations = ${JSON.stringify(primaryAnalysis.recommendations)},
          processing_stats = ${JSON.stringify(primaryAnalysis.processingStats)},
          ai_analysis = ${JSON.stringify(allAnalyses)},
          status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${jobId}
      `;
      
      console.log(`✅ Stored ${allAnalyses.length} AI analysis results for job: ${jobId}`);
      
      return allAnalyzedAds.length;
    });
    
    return { 
      success: true, 
      jobId,
      results: {
        totalProcessed: analysisResults.stats.processed,
        contentTypes: {
          textOnly: analysisResults.stats.textOnly,
          textWithImage: analysisResults.stats.textWithImage,
          textWithVideo: analysisResults.stats.textWithVideo,
          mixed: analysisResults.stats.mixed
        },
        skipped: analysisResults.stats.skippedLargeVideos,
        errors: analysisResults.stats.errors,
        adsAnalyzed: adsCount
      },
      message: "AI analysis completed successfully"
    };
  }
);

module.exports = { aiAnalyze };