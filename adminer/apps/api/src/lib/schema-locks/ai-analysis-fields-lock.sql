-- AI Analysis Fields Schema Lock - Architecture Lock Phase 4
-- This file adds AI analysis fields to the existing jobs table

-- Add AI analysis fields to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) CHECK (content_type IN ('text_only', 'text_with_image', 'text_with_video', 'mixed'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS text_analysis JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS image_analysis JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS video_analysis JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS combined_analysis JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rewritten_ad_copy TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS key_insights JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS competitor_strategy TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recommendations JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS processing_stats JSONB;

-- Add indexes for AI analysis fields
CREATE INDEX IF NOT EXISTS idx_jobs_content_type ON jobs(content_type);
CREATE INDEX IF NOT EXISTS idx_jobs_summary ON jobs(summary) WHERE summary IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_competitor_strategy ON jobs(competitor_strategy) WHERE competitor_strategy IS NOT NULL;

-- Add comments for AI analysis fields
COMMENT ON COLUMN jobs.content_type IS 'Content type detected: text_only, text_with_image, text_with_video, mixed';
COMMENT ON COLUMN jobs.text_analysis IS 'Text-only analysis results (JSONB)';
COMMENT ON COLUMN jobs.image_analysis IS 'Image analysis results from GPT-4o (JSONB)';
COMMENT ON COLUMN jobs.video_analysis IS 'Video analysis results from Gemini (JSONB)';
COMMENT ON COLUMN jobs.combined_analysis IS 'Combined analysis results (JSONB)';
COMMENT ON COLUMN jobs.summary IS 'Strategic analysis summary';
COMMENT ON COLUMN jobs.rewritten_ad_copy IS 'Rewritten ad copy for repurposing';
COMMENT ON COLUMN jobs.key_insights IS 'Key insights array (JSONB)';
COMMENT ON COLUMN jobs.competitor_strategy IS 'Competitor strategy assessment';
COMMENT ON COLUMN jobs.recommendations IS 'Recommendations array (JSONB)';
COMMENT ON COLUMN jobs.processing_stats IS 'AI processing statistics (JSONB)';