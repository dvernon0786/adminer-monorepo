#!/usr/bin/env node

/**
 * TEST AI ANALYSIS SYSTEM
 * Tests the unified AI analyzer with sample data
 */

require('dotenv').config({ path: '.env.local' });
const { UnifiedApifyAnalyzer } = require('./src/lib/unified-ai-analyzer.js');

async function testAIAnalysis() {
  console.log('🧪 Testing AI Analysis System...');
  
  // Check environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    process.exit(1);
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('✅ Environment variables found');

  // Sample Apify data for testing
  const sampleAdsData = [
    {
      ad_archive_id: 'test_ad_1',
      snapshot: {
        body: {
          text: 'Get 50% off our premium products! Limited time offer. Shop now!'
        },
        title: 'Premium Products Sale',
        cta_text: 'Shop Now',
        page_name: 'Test Brand',
        images: [
          {
            original_image_url: 'https://via.placeholder.com/600x400/FF6B6B/FFFFFF?text=Test+Ad+Image'
          }
        ]
      }
    },
    {
      ad_archive_id: 'test_ad_2',
      snapshot: {
        body: {
          text: 'Discover our new collection of sustainable fashion items.'
        },
        title: 'Sustainable Fashion',
        cta_text: 'Learn More',
        page_name: 'Eco Brand',
        videos: [
          {
            video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
          }
        ]
      }
    },
    {
      ad_archive_id: 'test_ad_3',
      snapshot: {
        body: {
          text: 'Join thousands of satisfied customers. Start your free trial today!'
        },
        title: 'Free Trial',
        cta_text: 'Start Free Trial',
        page_name: 'SaaS Company'
      }
    }
  ];

  try {
    const analyzer = new UnifiedApifyAnalyzer();
    
    console.log('🔄 Processing sample ads with AI analysis...');
    const results = await analyzer.processApifyData(sampleAdsData);
    
    console.log('📊 Analysis Results:');
    console.log(`✅ Successfully analyzed: ${results.stats.processed}`);
    console.log(`📝 Text-only ads: ${results.stats.textOnly}`);
    console.log(`🖼️ Text + Image ads: ${results.stats.textWithImage}`);
    console.log(`🎥 Text + Video ads: ${results.stats.textWithVideo}`);
    console.log(`⏭️ Skipped large videos: ${results.stats.skippedLargeVideos}`);
    console.log(`❌ Errors: ${results.stats.errors}`);
    
    console.log('\n📋 Detailed Results:');
    console.log(JSON.stringify(results, null, 2));
    
    console.log('\n✅ AI Analysis test completed successfully!');
    
  } catch (error) {
    console.error('❌ AI Analysis test failed:', error);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testAIAnalysis().catch(console.error);
}

module.exports = { testAIAnalysis };