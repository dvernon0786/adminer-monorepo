
-- Indexes and Constraints Lock - Architecture Lock Phase 3
-- This file locks all database indexes and constraints to prevent regression

-- ===============================================
-- ORGANIZATIONS TABLE INDEXES AND CONSTRAINTS
-- ===============================================

-- Organizations Table Indexes (LOCKED)
CREATE INDEX IF NOT EXISTS idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);
CREATE INDEX IF NOT EXISTS idx_organizations_billing_status ON organizations(billing_status);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_organizations_quota_used ON organizations(quota_used);
CREATE INDEX IF NOT EXISTS idx_organizations_quota_limit ON organizations(quota_limit);

-- Organizations Table Constraints (LOCKED)
ALTER TABLE organizations ADD CONSTRAINT IF NOT EXISTS chk_quota_usage 
  CHECK (quota_used <= quota_limit);
ALTER TABLE organizations ADD CONSTRAINT IF NOT EXISTS chk_plan_valid 
  CHECK (plan IN ('free', 'pro', 'enterprise'));
ALTER TABLE organizations ADD CONSTRAINT IF NOT EXISTS chk_billing_status_valid 
  CHECK (billing_status IN ('inactive', 'active', 'cancelled', 'past_due'));

-- ===============================================
-- SUBSCRIPTIONS TABLE INDEXES AND CONSTRAINTS
-- ===============================================

-- Subscriptions Table Indexes (LOCKED)
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_subscription_id ON subscriptions(dodo_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Subscriptions Table Constraints (LOCKED)
ALTER TABLE subscriptions ADD CONSTRAINT IF NOT EXISTS chk_subscription_plan_valid 
  CHECK (plan IN ('free', 'pro', 'enterprise'));
ALTER TABLE subscriptions ADD CONSTRAINT IF NOT EXISTS chk_subscription_status_valid 
  CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'));
ALTER TABLE subscriptions ADD CONSTRAINT IF NOT EXISTS chk_subscription_amount_positive 
  CHECK (amount >= 0);

-- ===============================================
-- WEBHOOK EVENTS TABLE INDEXES AND CONSTRAINTS
-- ===============================================

-- Webhook Events Table Indexes (LOCKED)
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_org_id ON webhook_events(org_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- Webhook Events Table Constraints (LOCKED)
ALTER TABLE webhook_events ADD CONSTRAINT IF NOT EXISTS chk_webhook_event_type_not_empty 
  CHECK (LENGTH(event_type) > 0);

-- ===============================================
-- SCRAPING JOBS TABLE INDEXES AND CONSTRAINTS
-- ===============================================

-- Scraping Jobs Table Indexes (LOCKED)
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_org_id ON scraping_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_keyword ON scraping_jobs(keyword);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_apify_run_id ON scraping_jobs(apify_run_id);

-- Scraping Jobs Table Constraints (LOCKED)
ALTER TABLE scraping_jobs ADD CONSTRAINT IF NOT EXISTS chk_scraping_job_status_valid 
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));
ALTER TABLE scraping_jobs ADD CONSTRAINT IF NOT EXISTS chk_scraping_job_keyword_not_empty 
  CHECK (LENGTH(keyword) > 0);
ALTER TABLE scraping_jobs ADD CONSTRAINT IF NOT EXISTS chk_scraping_job_retry_count_positive 
  CHECK (retry_count >= 0);

-- ===============================================
-- CROSS-TABLE CONSTRAINTS (LOCKED)
-- ===============================================

-- Ensure subscription plan matches organization plan
CREATE OR REPLACE FUNCTION check_subscription_plan_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = NEW.org_id AND plan = NEW.plan
  ) THEN
    RAISE EXCEPTION 'Subscription plan must match organization plan';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription plan validation (LOCKED)
DROP TRIGGER IF EXISTS trigger_check_subscription_plan_match ON subscriptions;
CREATE TRIGGER trigger_check_subscription_plan_match
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_plan_match();

-- ===============================================
-- PERFORMANCE INDEXES (LOCKED)
-- ===============================================

-- Composite indexes for common queries (LOCKED)
CREATE INDEX IF NOT EXISTS idx_organizations_plan_quota ON organizations(plan, quota_used, quota_limit);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_status ON subscriptions(org_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_org_processed ON webhook_events(org_id, processed);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_org_status ON scraping_jobs(org_id, status);
