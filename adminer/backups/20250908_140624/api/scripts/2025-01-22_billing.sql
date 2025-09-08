-- Billing system migration for Adminer
-- Run this in your Neon PostgreSQL database
-- Date: 2025-01-22

-- 1. Add missing billing fields to orgs table (idempotent)
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS billing_status text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

-- 2. Update webhook_events table structure for production-ready version (idempotent)
-- Add missing fields if they don't exist
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS received_at timestamptz;

-- 3. Create jobs table if it doesn't exist (for quota tracking)
CREATE TABLE IF NOT EXISTS jobs (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Add other job-related fields as needed
  job_type text,
  status text DEFAULT 'pending',
  result jsonb
);

-- 4. Create indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_orgs_billing_status ON orgs(billing_status);
CREATE INDEX IF NOT EXISTS idx_orgs_cancel_at_period_end ON orgs(cancel_at_period_end);
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- 5. Update existing webhook_events to use new structure
-- This is safe to run multiple times
UPDATE webhook_events 
SET 
  type = event_type,
  payload = data::jsonb,
  received_at = processed_at
WHERE type IS NULL AND event_type IS NOT NULL;

-- 6. Verify the migration
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('orgs', 'webhook_events', 'jobs', 'quota_usage')
ORDER BY table_name, ordinal_position;

-- 7. Show current data structure
SELECT 
  'orgs' as table_name,
  count(*) as row_count
FROM orgs
UNION ALL
SELECT 
  'webhook_events' as table_name,
  count(*) as row_count
FROM webhook_events
UNION ALL
SELECT 
  'jobs' as table_name,
  count(*) as row_count
FROM jobs
UNION ALL
SELECT 
  'quota_usage' as table_name,
  count(*) as row_count
FROM quota_usage; 