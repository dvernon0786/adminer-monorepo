/**
 * DASHBOARD ANALYTICS API ENDPOINT
 * Fetches AI analysis results for dashboard display
 */

const { neon } = require('@neondatabase/serverless');

const database = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { organizationId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    if (!database) {
      return res.status(500).json({ error: 'Database not available' });
    }

    console.log(`📊 Fetching dashboard analytics for organization: ${organizationId}`);

    // Fetch analytics data from database
    const analyticsData = await database.query(`
      SELECT 
        j.id,
        j.input->>'keyword' as keyword,
        j.content_type,
        j.status,
        j.summary,
        j.key_insights,
        j.competitor_strategy,
        j.recommendations,
        j.rewritten_ad_copy,
        j.processing_stats,
        j.created_at,
        j.completed_at,
        o.name as org_name
      FROM jobs j
      JOIN organizations o ON j.org_id = o.id
      WHERE o.clerk_org_id = $1
        AND j.content_type IS NOT NULL
        AND j.status = 'completed'
      ORDER BY j.created_at DESC
      LIMIT 100
    `, [organizationId]);

    // Calculate statistics
    const stats = analyticsData.reduce((acc, item) => {
      const type = item.content_type;
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
      }
      return acc;
    }, {
      total: 0,
      text_only: 0,
      text_with_image: 0,
      text_with_video: 0,
      mixed: 0
    });

    // Transform data for dashboard
    const analyses = analyticsData.map(item => ({
      id: item.id,
      adArchiveId: item.id, // Using job ID as archive ID for now
      pageName: item.org_name,
      contentType: item.content_type,
      analysisStatus: item.status === 'completed' ? 'completed' : 'pending',
      createdAt: item.created_at,
      summary: item.summary,
      keyInsights: item.key_insights || [],
      competitorStrategy: item.competitor_strategy,
      recommendations: item.recommendations || [],
      rewrittenAdCopy: item.rewritten_ad_copy,
      processingStats: item.processing_stats || {},
      keyword: item.keyword
    }));

    console.log(`✅ Fetched ${analyses.length} analyses for dashboard`);

    return res.status(200).json({
      success: true,
      data: {
        analyses: analyses,
        stats: stats,
        totalAnalyzed: analyses.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Dashboard analytics error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch dashboard analytics',
      details: error.message 
    });
  }
}