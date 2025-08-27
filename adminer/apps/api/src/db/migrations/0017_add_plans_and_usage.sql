-- Migration: Add plans and usage tables for Dodo integration
-- Date: 2025-01-27

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_quota INTEGER NOT NULL
);

-- Create usage table
CREATE TABLE IF NOT EXISTS usage (
  org_id TEXT NOT NULL,
  yyyymm TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (org_id, yyyymm),
  FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE
);

-- Add plan_code column to orgs table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orgs' AND column_name = 'plan_code'
  ) THEN
    ALTER TABLE orgs ADD COLUMN plan_code TEXT REFERENCES plans(code);
  END IF;
END $$;

-- Seed default plans
INSERT INTO plans (code, name, monthly_quota) VALUES
  ('free-10', 'Free', 10),
  ('pro-500', 'Pro', 500),
  ('ent-2000', 'Enterprise', 2000)
ON CONFLICT (code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_org_yyyymm ON usage(org_id, yyyymm);
CREATE INDEX IF NOT EXISTS idx_plans_code ON plans(code); 