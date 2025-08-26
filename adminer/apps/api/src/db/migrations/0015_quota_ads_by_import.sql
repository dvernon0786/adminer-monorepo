-- Migration: 0015_quota_ads_by_import.sql
-- Description: Change quota system from "per analysis job" to "per ads imported"
-- Date: 2025-01-22

BEGIN;

-- 1) Add new columns to jobs table
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS ads_requested integer NOT NULL DEFAULT 0;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS ads_imported integer NOT NULL DEFAULT 0;

-- 2) Backfill ads_imported from existing quota_debit (legacy)
UPDATE jobs
SET ads_imported = COALESCE(quota_debit, 0)
WHERE ads_imported = 0;

-- 3) Ensure quota_debit mirrors ads_imported (compat)
UPDATE jobs
SET quota_debit = ads_imported
WHERE quota_debit IS DISTINCT FROM ads_imported;

-- 4) Non-negative guards (idempotent)
DO $$
BEGIN
  ALTER TABLE jobs
    ADD CONSTRAINT jobs_ads_requested_nonneg CHECK (ads_requested >= 0);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE jobs
    ADD CONSTRAINT jobs_ads_imported_nonneg CHECK (ads_imported >= 0);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END$$;

-- 5) Normalize org quota defaults
-- Make sure defaults exist for monthly fields (don't change nullability here)
ALTER TABLE orgs ALTER COLUMN quota_monthly SET DEFAULT 0;
ALTER TABLE orgs ALTER COLUMN quota_used_month SET DEFAULT 0;

-- Initialize quota_month if missing
UPDATE orgs
SET quota_month = DATE_TRUNC('month', NOW())::date
WHERE quota_month IS NULL;

-- 6) Set org monthly limits by plan
UPDATE orgs SET quota_monthly = 0    WHERE plan = 'free'        AND quota_monthly IS DISTINCT FROM 0;
UPDATE orgs SET quota_monthly = 500  WHERE plan = 'pro'         AND quota_monthly IS DISTINCT FROM 500;
UPDATE orgs SET quota_monthly = 2000 WHERE plan = 'enterprise'  AND quota_monthly IS DISTINCT FROM 2000;

-- 7) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_ads_requested ON jobs (ads_requested);
CREATE INDEX IF NOT EXISTS idx_jobs_ads_imported ON jobs (ads_imported);
CREATE INDEX IF NOT EXISTS idx_jobs_org_ads ON jobs (org_id, ads_imported);

-- 8) Add comments for documentation
COMMENT ON COLUMN jobs.ads_requested IS 'Number of ads the user requested to fetch for this keyword';
COMMENT ON COLUMN jobs.ads_imported IS 'Number of ads actually imported after applying caps/quota';
COMMENT ON COLUMN jobs.quota_debit IS 'Quota units consumed (equals ads_imported for Pro/Ent, 0 for Free)';

COMMIT; 