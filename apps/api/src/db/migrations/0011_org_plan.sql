-- Migration: 0011_org_plan.sql
-- Add plan and external customer ID to organizations

ALTER TABLE orgs ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise'));
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS external_customer_id text;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_orgs_external_customer_id ON orgs(external_customer_id);
CREATE INDEX IF NOT EXISTS idx_orgs_plan ON orgs(plan);

-- Add constraint to ensure valid plan values
ALTER TABLE orgs ADD CONSTRAINT IF NOT EXISTS check_valid_plan CHECK (plan IN ('free', 'pro', 'enterprise')); 