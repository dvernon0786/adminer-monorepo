
-- Organizations Table Schema Lock - Architecture Lock Phase 3
-- This file locks the organizations table structure to prevent regression

CREATE TABLE IF NOT EXISTS organizations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Clerk Integration
  clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Plan and Quota Management
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  plan_code VARCHAR(100) DEFAULT 'free-10',
  quota_used INTEGER DEFAULT 0 CHECK (quota_used >= 0),
  quota_limit INTEGER DEFAULT 10 CHECK (quota_limit > 0),
  
  -- Billing Integration
  dodo_customer_id VARCHAR(255),
  billing_status VARCHAR(50) DEFAULT 'inactive' CHECK (billing_status IN ('inactive', 'active', 'cancelled', 'past_due')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations Table Indexes Lock
CREATE INDEX IF NOT EXISTS idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);
CREATE INDEX IF NOT EXISTS idx_organizations_billing_status ON organizations(billing_status);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);

-- Organizations Table Constraints Lock
ALTER TABLE organizations ADD CONSTRAINT IF NOT EXISTS chk_quota_usage 
  CHECK (quota_used <= quota_limit);

-- Organizations Table Comments Lock
COMMENT ON TABLE organizations IS 'Organizations table - LOCKED: Do not modify structure';
COMMENT ON COLUMN organizations.id IS 'Primary key - LOCKED';
COMMENT ON COLUMN organizations.clerk_org_id IS 'Clerk organization ID - LOCKED';
COMMENT ON COLUMN organizations.plan IS 'Subscription plan - LOCKED';
COMMENT ON COLUMN organizations.quota_used IS 'Current quota usage - LOCKED';
COMMENT ON COLUMN organizations.quota_limit IS 'Quota limit for plan - LOCKED';
COMMENT ON COLUMN organizations.dodo_customer_id IS 'Dodo Payments customer ID - LOCKED';
COMMENT ON COLUMN organizations.billing_status IS 'Billing status - LOCKED';
