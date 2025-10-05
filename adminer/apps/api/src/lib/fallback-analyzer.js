/**
 * FALLBACK ANALYZER FOR RATE LIMIT SCENARIOS
 * Provides basic analysis when AI APIs are rate limited
 */

class FallbackAnalyzer {
  constructor() {
    this.basicInsights = [
      "Ad uses standard marketing language",
      "Target audience appears to be general consumers",
      "Call-to-action is present and clear",
      "Ad follows common Facebook ad patterns"
    ];
  }

  /**
   * Provide basic analysis when AI APIs are unavailable
   */
  analyzeAd(ad) {
    const contentType = this.detectContentType(ad);
    
    return {
      step1_analysis: this.getBasicAnalysis(ad, contentType),
      step2_strategic_analysis: this.getStrategicAnalysis(ad, contentType),
      combined_analysis: this.getCombinedAnalysis(ad, contentType),
      fallback: true,
      reason: "AI APIs rate limited - using fallback analysis"
    };
  }

  /**
   * Detect content type
   */
  detectContentType(ad) {
    const hasText = ad.snapshot?.body?.text && ad.snapshot.body.text.trim().length > 0;
    const hasImages = ad.snapshot?.images && 
      ad.snapshot.images.length > 0 && 
      ad.snapshot.images[0]?.original_image_url;
    const hasVideos = ad.snapshot?.videos && 
      ad.snapshot.videos.length > 0 &&
      ad.snapshot.videos.some(v => v.video_url?.includes('https://video'));

    if (hasText && hasImages && !hasVideos) return 'text_with_image';
    if (hasText && hasVideos && !hasImages) return 'text_with_video';
    if (hasText && !hasImages && !hasVideos) return 'text_only';
    
    return 'text_only';
  }

  /**
   * Get basic analysis based on content type
   */
  getBasicAnalysis(ad, contentType) {
    const text = ad.snapshot?.body?.text || '';
    const title = ad.snapshot?.title || '';
    const cta = ad.snapshot?.cta_text || '';

    switch (contentType) {
      case 'text_with_image':
        return {
          visualElements: ["Image present", "Text overlay likely", "Standard ad format"],
          colorPsychology: "Standard color scheme used",
          designRecommendations: ["Consider A/B testing different images", "Optimize for mobile viewing"],
          brandConsistency: "Appears consistent with standard practices",
          visualAppeal: "Standard visual appeal"
        };
        
      case 'text_with_video':
        return {
          contentSummary: "Video ad with accompanying text",
          pacing: "Standard video pacing",
          callToAction: cta || "Standard CTA present",
          visualElements: ["Video content", "Text overlay", "Standard format"],
          audioAnalysis: "Audio elements present",
          emotionalImpact: "Standard emotional appeal",
          targetAudience: "General audience",
          recommendations: ["Test different video lengths", "Optimize for sound-off viewing"]
        };
        
      default:
        return {
          textAnalysis: "Text-based ad analysis",
          wordCount: text.length,
          hasCTA: !!cta,
          hasTitle: !!title,
          sentiment: "Neutral"
        };
    }
  }

  /**
   * Get strategic analysis
   */
  getStrategicAnalysis(ad, contentType) {
    const text = ad.snapshot?.body?.text || '';
    const title = ad.snapshot?.title || '';
    const cta = ad.snapshot?.cta_text || '';
    const pageName = ad.snapshot?.page_name || '';

    return {
      summary: `Basic analysis of ${contentType} ad from ${pageName}. ${text.length > 0 ? 'Contains text content.' : ''} ${cta ? 'Includes call-to-action.' : ''}`,
      rewrittenAdCopy: this.generateRewrittenCopy(text, title, cta),
      keyInsights: this.generateKeyInsights(text, contentType),
      competitorStrategy: `Standard ${contentType} advertising approach`,
      recommendations: this.generateRecommendations(contentType)
    };
  }

  /**
   * Get combined analysis
   */
  getCombinedAnalysis(ad, contentType) {
    return {
      overallStrategy: `Basic ${contentType} advertising strategy`,
      contentAlignment: "Content appears aligned with standard practices",
      competitiveAdvantage: "Standard competitive positioning",
      recommendations: "Consider A/B testing different approaches"
    };
  }

  /**
   * Generate rewritten ad copy
   */
  generateRewrittenCopy(text, title, cta) {
    if (!text) return "No text content available for rewriting";
    
    // Basic rewriting - just add some variations
    const variations = [
      text,
      text.replace(/!/g, '.').replace(/\./g, '!'),
      text.replace(/you/gi, 'your audience'),
      text.replace(/get/gi, 'discover')
    ];
    
    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Generate key insights
   */
  generateKeyInsights(text, contentType) {
    const insights = [...this.basicInsights];
    
    if (text.length > 100) {
      insights.push("Ad uses detailed messaging");
    }
    
    if (contentType === 'text_with_image') {
      insights.push("Visual content enhances message");
    }
    
    if (contentType === 'text_with_video') {
      insights.push("Video format for higher engagement");
    }
    
    return insights;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(contentType) {
    const baseRecommendations = [
      "Test different headlines",
      "A/B test call-to-action buttons",
      "Monitor performance metrics"
    ];
    
    switch (contentType) {
      case 'text_with_image':
        return [...baseRecommendations, "Test different images", "Optimize for mobile"];
      case 'text_with_video':
        return [...baseRecommendations, "Test video lengths", "Add captions for accessibility"];
      default:
        return baseRecommendations;
    }
  }
}

module.exports = { FallbackAnalyzer };