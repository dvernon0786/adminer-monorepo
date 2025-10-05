#!/usr/bin/env node

/**
 * DATABASE MIGRATION SCRIPT
 * Adds AI analysis fields to the jobs table
 */

const { neon } = require('@neondatabase/serverless');

async function migrateDatabase() {
  const database = neon(process.env.DATABASE_URL);
  
  if (!database) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('🔄 Starting AI analysis fields migration...');

  try {
    // Add AI analysis fields to jobs table
    console.log('📝 Adding AI analysis fields to jobs table...');
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) CHECK (content_type IN ('text_only', 'text_with_image', 'text_with_video', 'mixed'));
    `);
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS text_analysis JSONB;
    `);
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS image_analysis JSONB;
    `);
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS video_analysis JSONB;
    `);
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS combined_analysis JSONB;
    `);
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS summary TEXT;
    `);
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rewritten_ad_copy TEXT;
    `);
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS key_insights JSONB;
    `);
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS competitor_strategy TEXT;
    `);
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recommendations JSONB;
    `);
    
    await database.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS processing_stats JSONB;
    `);

    // Add indexes for AI analysis fields
    console.log('📊 Adding indexes for AI analysis fields...');
    
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_content_type ON jobs(content_type);
    `);
    
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_summary ON jobs(summary) WHERE summary IS NOT NULL;
    `);
    
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_competitor_strategy ON jobs(competitor_strategy) WHERE competitor_strategy IS NOT NULL;
    `);

    // Add comments for AI analysis fields
    console.log('💬 Adding column comments...');
    
    await database.query(`
      COMMENT ON COLUMN jobs.content_type IS 'Content type detected: text_only, text_with_image, text_with_video, mixed';
    `);
    
    await database.query(`
      COMMENT ON COLUMN jobs.text_analysis IS 'Text-only analysis results (JSONB)';
    `);
    
    await database.query(`
      COMMENT ON COLUMN jobs.image_analysis IS 'Image analysis results from GPT-4o (JSONB)';
    `);
    
    await database.query(`
      COMMENT ON COLUMN jobs.video_analysis IS 'Video analysis results from Gemini (JSONB)';
    `);
    
    await database.query(`
      COMMENT ON COLUMN jobs.combined_analysis IS 'Combined analysis results (JSONB)';
    `);
    
    await database.query(`
      COMMENT ON COLUMN jobs.summary IS 'Strategic analysis summary';
    `);
    
    await database.query(`
      COMMENT ON COLUMN jobs.rewritten_ad_copy IS 'Rewritten ad copy for repurposing';
    `);
    
    await database.query(`
      COMMENT ON COLUMN jobs.key_insights IS 'Key insights array (JSONB)';
    `);
    
    await database.query(`
      COMMENT ON COLUMN jobs.competitor_strategy IS 'Competitor strategy assessment';
    `);
    
    await database.query(`
      COMMENT ON COLUMN jobs.recommendations IS 'Recommendations array (JSONB)';
    `);
    
    await database.query(`
      COMMENT ON COLUMN jobs.processing_stats IS 'AI processing statistics (JSONB)';
    `);

    console.log('✅ AI analysis fields migration completed successfully!');
    console.log('📋 Added fields:');
    console.log('  - content_type (VARCHAR)');
    console.log('  - text_analysis (JSONB)');
    console.log('  - image_analysis (JSONB)');
    console.log('  - video_analysis (JSONB)');
    console.log('  - combined_analysis (JSONB)');
    console.log('  - summary (TEXT)');
    console.log('  - rewritten_ad_copy (TEXT)');
    console.log('  - key_insights (JSONB)');
    console.log('  - competitor_strategy (TEXT)');
    console.log('  - recommendations (JSONB)');
    console.log('  - processing_stats (JSONB)');
    console.log('🎯 Ready for AI analysis processing!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateDatabase().catch(console.error);
}

module.exports = { migrateDatabase };