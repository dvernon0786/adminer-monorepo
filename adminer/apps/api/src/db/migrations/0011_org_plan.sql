-- apps/api/drizzle/0011_org_plan.sql
DO $$ BEGIN
  CREATE TYPE plan AS ENUM ('free','pro','enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS plan plan NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS dodo_customer_id VARCHAR(128),
  ADD COLUMN IF NOT EXISTS dodo_subscription_id VARCHAR(128),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(64) DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS monthly_usage INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_limit INT NOT NULL DEFAULT 10;

-- Backfill limits by plan
UPDATE orgs SET monthly_limit = CASE plan
  WHEN 'free' THEN 10
  WHEN 'pro' THEN 500
  WHEN 'enterprise' THEN 2000
  ELSE 10 END; 