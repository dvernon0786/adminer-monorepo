-- Migration: 0014_jobs_analysis_columns.sql
-- Description: Add comprehensive analysis columns for AI-powered ad analysis
-- Date: 2025-01-22

-- Add derived/normalized columns from raw_data
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "ad_archive_id" varchar(64);
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "page_profile_uri" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "page_id" varchar(64);
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "page_name" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "content_type" varchar(24);
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "is_active" boolean;

-- Add text strategy analysis columns (GPT-4o Mini)
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "summary" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "rewritten_ad_copy" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "key_insights" jsonb;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "competitor_strategy" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "recommendations" jsonb;

-- Add model prompts/outputs for image/video analysis
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "image_prompt" jsonb;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "video_prompt" jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_content_type ON "jobs" ("content_type");
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON "jobs" ("is_active");
CREATE INDEX IF NOT EXISTS idx_jobs_page_name ON "jobs" ("page_name");

-- Add comments for documentation
COMMENT ON COLUMN "jobs"."ad_archive_id" IS 'Facebook Ad Archive ID from scraped data';
COMMENT ON COLUMN "jobs"."page_profile_uri" IS 'Facebook page profile URI';
COMMENT ON COLUMN "jobs"."page_id" IS 'Facebook page ID';
COMMENT ON COLUMN "jobs"."page_name" IS 'Facebook page name';
COMMENT ON COLUMN "jobs"."content_type" IS 'Content type: text, image+text, or text+video';
COMMENT ON COLUMN "jobs"."is_active" IS 'Whether the ad is currently active';
COMMENT ON COLUMN "jobs"."summary" IS 'AI-generated strategic analysis summary';
COMMENT ON COLUMN "jobs"."rewritten_ad_copy" IS 'AI-rewritten ad copy for fresh use';
COMMENT ON COLUMN "jobs"."key_insights" IS 'Array of key strategic insights';
COMMENT ON COLUMN "jobs"."competitor_strategy" IS 'Analysis of competitor strategy';
COMMENT ON COLUMN "jobs"."recommendations" IS 'Array of strategic recommendations';
COMMENT ON COLUMN "jobs"."image_prompt" IS 'GPT-4o vision analysis results';
COMMENT ON COLUMN "jobs"."video_prompt" IS 'Gemini 1.5 flash analysis results'; 