-- Create orgs table for Adminer
-- Run this in your Neon PostgreSQL database

CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  name TEXT,
  plan TEXT DEFAULT 'free',
  quota_limit INTEGER DEFAULT 10,
  quota_used INTEGER DEFAULT 0,
  dodo_customer_id TEXT,
  dodo_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orgs_id ON orgs(id);

-- Insert a sample free org (optional)
-- INSERT INTO orgs (id, name, plan, quota_limit, quota_used) 
-- VALUES ('sample-org', 'Sample Organization', 'free', 10, 0); 