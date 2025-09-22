
-- Subscriptions Table Schema Lock - Architecture Lock Phase 3
-- This file locks the subscriptions table structure to prevent regression

CREATE TABLE IF NOT EXISTS subscriptions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Reference
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Dodo Payments Integration
  dodo_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  dodo_customer_id VARCHAR(255),
  
  -- Subscription Details
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  plan_code VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
  
  -- Pricing Information
  amount INTEGER NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Billing Period
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions Table Indexes Lock
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_subscription_id ON subscriptions(dodo_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

-- Subscriptions Table Comments Lock
COMMENT ON TABLE subscriptions IS 'Subscriptions table - LOCKED: Do not modify structure';
COMMENT ON COLUMN subscriptions.org_id IS 'Organization reference - LOCKED';
COMMENT ON COLUMN subscriptions.dodo_subscription_id IS 'Dodo subscription ID - LOCKED';
COMMENT ON COLUMN subscriptions.plan IS 'Subscription plan - LOCKED';
COMMENT ON COLUMN subscriptions.status IS 'Subscription status - LOCKED';
