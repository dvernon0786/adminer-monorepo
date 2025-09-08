-- Create comprehensive billing tables for Adminer
-- Run this in your Neon PostgreSQL database

-- 1. Organizations table with billing support
CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  name TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  quota_limit INTEGER DEFAULT 10,
  quota_used INTEGER DEFAULT 0,
  dodo_customer_id TEXT,
  dodo_subscription_id TEXT,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Webhook events table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  org_id TEXT NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  data TEXT -- JSON string of event data
);

-- 3. Quota usage tracking table
CREATE TABLE IF NOT EXISTS quota_usage (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  job_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  billing_period TEXT NOT NULL -- YYYY-MM format
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orgs_id ON orgs(id);
CREATE INDEX IF NOT EXISTS idx_orgs_dodo_customer_id ON orgs(dodo_customer_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_id ON webhook_events(id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_org_id ON webhook_events(org_id);
CREATE INDEX IF NOT EXISTS idx_quota_usage_org_id ON quota_usage(org_id);
CREATE INDEX IF NOT EXISTS idx_quota_usage_billing_period ON quota_usage(billing_period);

-- Insert sample data (optional)
-- INSERT INTO orgs (id, name, plan, quota_limit, quota_used) 
-- VALUES ('sample-org', 'Sample Organization', 'free', 10, 0);

-- Verify tables created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('orgs', 'webhook_events', 'quota_usage')
ORDER BY table_name, ordinal_position; 