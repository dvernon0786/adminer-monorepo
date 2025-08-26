-- Migration: 0013_jobs_enhanced.sql
-- Description: Enhanced jobs table with comprehensive job tracking capabilities
-- Date: 2025-01-22

-- Drop existing jobs table if it exists (for clean migration)
DROP TABLE IF EXISTS "jobs" CASCADE;

-- Create enhanced jobs table
CREATE TABLE IF NOT EXISTS "jobs" (
  "id" varchar(36) PRIMARY KEY,
  "org_id" varchar(64) NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
  "requested_by" varchar(64) NOT NULL,
  "keyword" text NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'queued',
  "apify_run_id" varchar(64),
  "input" jsonb DEFAULT '{}'::jsonb,
  "raw_data" jsonb,
  "analysis" jsonb,
  "error" text,
  "quota_debit" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_jobs_org_id" ON "jobs" ("org_id");
CREATE INDEX IF NOT EXISTS "idx_jobs_status" ON "jobs" ("status");
CREATE INDEX IF NOT EXISTS "idx_jobs_requested_by" ON "jobs" ("requested_by");
CREATE INDEX IF NOT EXISTS "idx_jobs_created_at" ON "jobs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_jobs_apify_run_id" ON "jobs" ("apify_run_id");

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_jobs_org_status" ON "jobs" ("org_id", "status");
CREATE INDEX IF NOT EXISTS "idx_jobs_org_created" ON "jobs" ("org_id", "created_at");

-- Add constraint for valid job statuses
ALTER TABLE "jobs" ADD CONSTRAINT "chk_jobs_status" 
  CHECK ("status" IN ('queued', 'running', 'completed', 'failed'));

-- Add constraint for positive quota debit
ALTER TABLE "jobs" ADD CONSTRAINT "chk_jobs_quota_debit" 
  CHECK ("quota_debit" > 0);

-- Add constraint for non-empty keyword
ALTER TABLE "jobs" ADD CONSTRAINT "chk_jobs_keyword" 
  CHECK (length(trim("keyword")) > 0);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_jobs_updated_at ON "jobs";
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON "jobs" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO "jobs" ("id", "org_id", "requested_by", "keyword", "status", "input") 
-- VALUES (
--   'sample-job-001', 
--   'sample-org-001', 
--   'sample-user-001', 
--   'test keyword', 
--   'queued', 
--   '{"priority": "normal"}'::jsonb
-- );

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "jobs" TO your_app_user;
-- GRANT USAGE ON SEQUENCE jobs_id_seq TO your_app_user; 