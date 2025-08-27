-- apps/api/drizzle/0012_quota_tracking.sql
-- Add proper quota tracking fields for monthly window management

ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS quota_monthly INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS quota_used_month INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quota_month DATE NOT NULL DEFAULT date_trunc('month', now())::date;

-- Backfill quota_monthly based on existing plan and monthly_limit
UPDATE orgs SET 
  quota_monthly = CASE plan
    WHEN 'free' THEN 10
    WHEN 'pro' THEN 500
    WHEN 'enterprise' THEN 2000
    ELSE 10 
  END,
  quota_month = date_trunc('month', now())::date;

-- Migrate existing monthly_usage to quota_used_month
UPDATE orgs SET 
  quota_used_month = monthly_usage 
WHERE quota_used_month = 0;

-- Create index on quota_month for efficient month boundary queries
CREATE INDEX IF NOT EXISTS idx_orgs_quota_month ON orgs(quota_month);

-- Create index on id + quota_month for efficient quota lookups
CREATE INDEX IF NOT EXISTS idx_orgs_quota_lookup ON orgs(id, quota_month); 