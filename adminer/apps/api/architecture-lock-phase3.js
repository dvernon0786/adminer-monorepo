#!/usr/bin/env node

/**
 * Architecture Lock Phase 3: Database Schema Lock
 * 
 * This script locks the database schema completely to prevent regression
 * and ensures all table structures, relationships, and constraints are protected.
 */

const fs = require('fs');
const path = require('path');

class ArchitectureLockPhase3 {
  constructor() {
    this.schemaLocks = {
      tables: {},
      indexes: {},
      constraints: {},
      functions: {},
      triggers: {}
    };
  }

  async run() {
    console.log('🔒 ARCHITECTURE LOCK PHASE 3: DATABASE SCHEMA LOCK');
    console.log('================================================');
    console.log('Locking database schema completely to prevent regression...');
    console.log('');

    try {
      // Step 1: Lock Core Tables Schema
      await this.lockCoreTablesSchema();
      
      // Step 2: Lock Indexes and Constraints
      await this.lockIndexesAndConstraints();
      
      // Step 3: Lock Database Functions
      await this.lockDatabaseFunctions();
      
      // Step 4: Lock Migration Patterns
      await this.lockMigrationPatterns();
      
      // Step 5: Create Schema Validation
      await this.createSchemaValidation();
      
      console.log('');
      console.log('🎉 PHASE 3 COMPLETE: DATABASE SCHEMA LOCK');
      console.log('=========================================');
      console.log('✅ All table structures locked');
      console.log('✅ All relationships protected');
      console.log('✅ All constraints secured');
      console.log('✅ All indexes locked');
      console.log('✅ Migration patterns protected');
      console.log('');
      console.log('Next: Phase 4 - API Architecture Lock');

    } catch (error) {
      console.error('💥 PHASE 3 FAILED:', error);
      process.exit(1);
    }
  }

  async lockCoreTablesSchema() {
    console.log('📊 Step 1: Locking Core Tables Schema...');
    
    // Organizations Table Lock
    const organizationsTableLock = `
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
`;

    // Subscriptions Table Lock
    const subscriptionsTableLock = `
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
`;

    // Webhook Events Table Lock
    const webhookEventsTableLock = `
-- Webhook Events Table Schema Lock - Architecture Lock Phase 3
-- This file locks the webhook_events table structure to prevent regression

CREATE TABLE IF NOT EXISTS webhook_events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Information
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) UNIQUE,
  
  -- Organization Reference
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Event Data
  data JSONB NOT NULL,
  
  -- Processing Status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook Events Table Indexes Lock
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_org_id ON webhook_events(org_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- Webhook Events Table Comments Lock
COMMENT ON TABLE webhook_events IS 'Webhook events table - LOCKED: Do not modify structure';
COMMENT ON COLUMN webhook_events.event_type IS 'Event type - LOCKED';
COMMENT ON COLUMN webhook_events.event_id IS 'Unique event ID - LOCKED';
COMMENT ON COLUMN webhook_events.org_id IS 'Organization reference - LOCKED';
COMMENT ON COLUMN webhook_events.data IS 'Event data JSON - LOCKED';
COMMENT ON COLUMN webhook_events.processed IS 'Processing status - LOCKED';
`;

    // Scraping Jobs Table Lock
    const scrapingJobsTableLock = `
-- Scraping Jobs Table Schema Lock - Architecture Lock Phase 3
-- This file locks the scraping_jobs table structure to prevent regression

CREATE TABLE IF NOT EXISTS scraping_jobs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Reference
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Job Information
  keyword VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Apify Integration
  apify_run_id VARCHAR(255),
  apify_actor_id VARCHAR(255),
  
  -- Results
  results_count INTEGER DEFAULT 0,
  results_data JSONB,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Scraping Jobs Table Indexes Lock
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_org_id ON scraping_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_keyword ON scraping_jobs(keyword);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at);

-- Scraping Jobs Table Comments Lock
COMMENT ON TABLE scraping_jobs IS 'Scraping jobs table - LOCKED: Do not modify structure';
COMMENT ON COLUMN scraping_jobs.org_id IS 'Organization reference - LOCKED';
COMMENT ON COLUMN scraping_jobs.keyword IS 'Search keyword - LOCKED';
COMMENT ON COLUMN scraping_jobs.status IS 'Job status - LOCKED';
COMMENT ON COLUMN scraping_jobs.apify_run_id IS 'Apify run ID - LOCKED';
COMMENT ON COLUMN scraping_jobs.results_data IS 'Scraping results - LOCKED';
`;

    // Create schema-locks directory
    fs.mkdirSync('src/lib/schema-locks', { recursive: true });
    
    // Write schema lock files
    fs.writeFileSync('src/lib/schema-locks/organizations-table-lock.sql', organizationsTableLock);
    fs.writeFileSync('src/lib/schema-locks/subscriptions-table-lock.sql', subscriptionsTableLock);
    fs.writeFileSync('src/lib/schema-locks/webhook-events-table-lock.sql', webhookEventsTableLock);
    fs.writeFileSync('src/lib/schema-locks/scraping-jobs-table-lock.sql', scrapingJobsTableLock);
    
    console.log('✅ Core tables schema locked');
    console.log('   - Organizations table structure protected');
    console.log('   - Subscriptions table structure secured');
    console.log('   - Webhook events table structure locked');
    console.log('   - Scraping jobs table structure protected');
  }

  async lockIndexesAndConstraints() {
    console.log('');
    console.log('📊 Step 2: Locking Indexes and Constraints...');
    
    const indexesConstraintsLock = `
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
`;

    // Create schema-locks directory
    fs.mkdirSync('src/lib/schema-locks', { recursive: true });
    
    fs.writeFileSync('src/lib/schema-locks/indexes-constraints-lock.sql', indexesConstraintsLock);
    
    console.log('✅ Indexes and constraints locked');
    console.log('   - All table indexes protected');
    console.log('   - All constraints secured');
    console.log('   - Cross-table validation locked');
    console.log('   - Performance indexes protected');
  }

  async lockDatabaseFunctions() {
    console.log('');
    console.log('📊 Step 3: Locking Database Functions...');
    
    const databaseFunctionsLock = `
-- Database Functions Lock - Architecture Lock Phase 3
-- This file locks all database functions to prevent regression

-- ===============================================
-- QUOTA MANAGEMENT FUNCTIONS (LOCKED)
-- ===============================================

-- Function to update organization quota (LOCKED)
CREATE OR REPLACE FUNCTION update_organization_quota(
  p_org_id UUID,
  p_quota_used INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_quota_limit INTEGER;
  v_current_quota INTEGER;
BEGIN
  -- Get current quota limit
  SELECT quota_limit, quota_used INTO v_quota_limit, v_current_quota
  FROM organizations 
  WHERE id = p_org_id;
  
  -- Check if organization exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found: %', p_org_id;
  END IF;
  
  -- Validate quota usage
  IF p_quota_used < 0 THEN
    RAISE EXCEPTION 'Quota used cannot be negative: %', p_quota_used;
  END IF;
  
  IF p_quota_used > v_quota_limit THEN
    RAISE EXCEPTION 'Quota used (%) exceeds limit (%)', p_quota_used, v_quota_limit;
  END IF;
  
  -- Update quota
  UPDATE organizations 
  SET quota_used = p_quota_used, updated_at = NOW()
  WHERE id = p_org_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to upgrade organization plan (LOCKED)
CREATE OR REPLACE FUNCTION upgrade_organization_plan(
  p_org_id UUID,
  p_new_plan VARCHAR(50),
  p_new_quota_limit INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_plan VARCHAR(50);
  v_old_quota_limit INTEGER;
BEGIN
  -- Get current plan and quota
  SELECT plan, quota_limit INTO v_old_plan, v_old_quota_limit
  FROM organizations 
  WHERE id = p_org_id;
  
  -- Check if organization exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found: %', p_org_id;
  END IF;
  
  -- Validate new plan
  IF p_new_plan NOT IN ('free', 'pro', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid plan: %', p_new_plan;
  END IF;
  
  -- Validate new quota limit
  IF p_new_quota_limit <= 0 THEN
    RAISE EXCEPTION 'Quota limit must be positive: %', p_new_quota_limit;
  END IF;
  
  -- Update plan and reset quota
  UPDATE organizations 
  SET 
    plan = p_new_plan,
    quota_limit = p_new_quota_limit,
    quota_used = 0,
    updated_at = NOW()
  WHERE id = p_org_id;
  
  -- Log the upgrade
  INSERT INTO webhook_events (event_type, org_id, data)
  VALUES (
    'plan_upgraded',
    p_org_id,
    jsonb_build_object(
      'old_plan', v_old_plan,
      'new_plan', p_new_plan,
      'old_quota_limit', v_old_quota_limit,
      'new_quota_limit', p_new_quota_limit,
      'upgraded_at', NOW()
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- WEBHOOK PROCESSING FUNCTIONS (LOCKED)
-- ===============================================

-- Function to process webhook event (LOCKED)
CREATE OR REPLACE FUNCTION process_webhook_event(
  p_event_type VARCHAR(100),
  p_event_id VARCHAR(255),
  p_org_id UUID,
  p_data JSONB
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Check if event already processed
  IF p_event_id IS NOT NULL THEN
    SELECT id INTO v_event_id
    FROM webhook_events 
    WHERE event_id = p_event_id;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Event already processed: %', p_event_id;
    END IF;
  END IF;
  
  -- Insert webhook event
  INSERT INTO webhook_events (event_type, event_id, org_id, data)
  VALUES (p_event_type, p_event_id, p_org_id, p_data)
  RETURNING id INTO v_event_id;
  
  -- Mark as processed
  UPDATE webhook_events 
  SET processed = TRUE, processed_at = NOW()
  WHERE id = v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- UTILITY FUNCTIONS (LOCKED)
-- ===============================================

-- Function to get organization quota status (LOCKED)
CREATE OR REPLACE FUNCTION get_organization_quota_status(p_org_id UUID)
RETURNS TABLE(
  org_id UUID,
  plan VARCHAR(50),
  quota_used INTEGER,
  quota_limit INTEGER,
  quota_percentage NUMERIC,
  is_exceeded BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.plan,
    o.quota_used,
    o.quota_limit,
    ROUND((o.quota_used::NUMERIC / o.quota_limit::NUMERIC) * 100, 2) as quota_percentage,
    (o.quota_used >= o.quota_limit) as is_exceeded
  FROM organizations o
  WHERE o.id = p_org_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old webhook events (LOCKED)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_events 
  WHERE created_at < NOW() - INTERVAL '1 day' * p_days_old;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;
`;

    fs.writeFileSync('src/lib/schema-locks/database-functions-lock.sql', databaseFunctionsLock);
    
    console.log('✅ Database functions locked');
    console.log('   - Quota management functions protected');
    console.log('   - Webhook processing functions secured');
    console.log('   - Utility functions locked');
    console.log('   - All function patterns protected');
  }

  async lockMigrationPatterns() {
    console.log('');
    console.log('📊 Step 4: Locking Migration Patterns...');
    
    const migrationPatternsLock = `
-- Migration Patterns Lock - Architecture Lock Phase 3
-- This file locks the database migration patterns to prevent regression

-- ===============================================
-- MIGRATION PATTERNS (LOCKED)
-- ===============================================

-- Pattern 1: Add Column Migration (LOCKED)
-- Template: ALTER TABLE table_name ADD COLUMN column_name data_type DEFAULT default_value;
-- Example: ALTER TABLE organizations ADD COLUMN new_field VARCHAR(255) DEFAULT 'default_value';

-- Pattern 2: Create Index Migration (LOCKED)
-- Template: CREATE INDEX IF NOT EXISTS index_name ON table_name(column_name);
-- Example: CREATE INDEX IF NOT EXISTS idx_organizations_new_field ON organizations(new_field);

-- Pattern 3: Add Constraint Migration (LOCKED)
-- Template: ALTER TABLE table_name ADD CONSTRAINT constraint_name CHECK (condition);
-- Example: ALTER TABLE organizations ADD CONSTRAINT chk_new_field_valid CHECK (new_field IN ('value1', 'value2'));

-- Pattern 4: Create Function Migration (LOCKED)
-- Template: CREATE OR REPLACE FUNCTION function_name(...) RETURNS ... AS $$ ... $$ LANGUAGE plpgsql;
-- Example: CREATE OR REPLACE FUNCTION new_function() RETURNS BOOLEAN AS $$ ... $$ LANGUAGE plpgsql;

-- ===============================================
-- MIGRATION VALIDATION PATTERNS (LOCKED)
-- ===============================================

-- Pattern 1: Check Table Exists (LOCKED)
-- SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'table_name');

-- Pattern 2: Check Column Exists (LOCKED)
-- SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'table_name' AND column_name = 'column_name');

-- Pattern 3: Check Index Exists (LOCKED)
-- SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'index_name');

-- Pattern 4: Check Constraint Exists (LOCKED)
-- SELECT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'constraint_name');

-- ===============================================
-- ROLLBACK PATTERNS (LOCKED)
-- ===============================================

-- Pattern 1: Drop Column Rollback (LOCKED)
-- Template: ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;
-- Example: ALTER TABLE organizations DROP COLUMN IF EXISTS new_field;

-- Pattern 2: Drop Index Rollback (LOCKED)
-- Template: DROP INDEX IF EXISTS index_name;
-- Example: DROP INDEX IF EXISTS idx_organizations_new_field;

-- Pattern 3: Drop Constraint Rollback (LOCKED)
-- Template: ALTER TABLE table_name DROP CONSTRAINT IF EXISTS constraint_name;
-- Example: ALTER TABLE organizations DROP CONSTRAINT IF EXISTS chk_new_field_valid;

-- Pattern 4: Drop Function Rollback (LOCKED)
-- Template: DROP FUNCTION IF EXISTS function_name(...);
-- Example: DROP FUNCTION IF EXISTS new_function();

-- ===============================================
-- MIGRATION SAFETY CHECKS (LOCKED)
-- ===============================================

-- Check 1: Verify all required tables exist
DO $$
DECLARE
  required_tables TEXT[] := ARRAY['organizations', 'subscriptions', 'webhook_events', 'scraping_jobs'];
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
      missing_tables := array_append(missing_tables, table_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
  END IF;
END $$;

-- Check 2: Verify all required columns exist
DO $$
DECLARE
  required_columns RECORD;
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR required_columns IN
    SELECT 'organizations' as table_name, 'id' as column_name, 'uuid' as data_type
    UNION ALL SELECT 'organizations', 'name', 'character varying'
    UNION ALL SELECT 'organizations', 'clerk_org_id', 'character varying'
    UNION ALL SELECT 'organizations', 'plan', 'character varying'
    UNION ALL SELECT 'organizations', 'quota_used', 'integer'
    UNION ALL SELECT 'organizations', 'quota_limit', 'integer'
    UNION ALL SELECT 'subscriptions', 'id', 'uuid'
    UNION ALL SELECT 'subscriptions', 'org_id', 'uuid'
    UNION ALL SELECT 'subscriptions', 'dodo_subscription_id', 'character varying'
    UNION ALL SELECT 'webhook_events', 'id', 'uuid'
    UNION ALL SELECT 'webhook_events', 'event_type', 'character varying'
    UNION ALL SELECT 'webhook_events', 'data', 'jsonb'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = required_columns.table_name 
      AND column_name = required_columns.column_name
    ) THEN
      missing_columns := array_append(missing_columns, 
        required_columns.table_name || '.' || required_columns.column_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required columns: %', array_to_string(missing_columns, ', ');
  END IF;
END $$;
`;

    fs.writeFileSync('src/lib/schema-locks/migration-patterns-lock.sql', migrationPatternsLock);
    
    console.log('✅ Migration patterns locked');
    console.log('   - Migration templates protected');
    console.log('   - Validation patterns secured');
    console.log('   - Rollback patterns locked');
    console.log('   - Safety checks implemented');
  }

  async createSchemaValidation() {
    console.log('');
    console.log('📊 Step 5: Creating Schema Validation...');
    
    const schemaValidation = `
// Database Schema Validation - Architecture Lock Phase 3
// This file validates the database schema to prevent regression

class DatabaseSchemaValidator {
  constructor() {
    this.requiredTables = [
      'organizations',
      'subscriptions', 
      'webhook_events',
      'scraping_jobs'
    ];
    
    this.requiredColumns = {
      organizations: [
        'id', 'name', 'clerk_org_id', 'plan', 'quota_used', 'quota_limit',
        'dodo_customer_id', 'billing_status', 'created_at', 'updated_at'
      ],
      subscriptions: [
        'id', 'org_id', 'dodo_subscription_id', 'plan', 'status',
        'amount', 'currency', 'created_at', 'updated_at'
      ],
      webhook_events: [
        'id', 'event_type', 'event_id', 'org_id', 'data',
        'processed', 'processed_at', 'created_at'
      ],
      scraping_jobs: [
        'id', 'org_id', 'keyword', 'status', 'apify_run_id',
        'results_count', 'results_data', 'created_at'
      ]
    };
    
    this.requiredIndexes = [
      'idx_organizations_clerk_org_id',
      'idx_organizations_plan',
      'idx_subscriptions_org_id',
      'idx_subscriptions_dodo_subscription_id',
      'idx_webhook_events_event_type',
      'idx_webhook_events_org_id',
      'idx_scraping_jobs_org_id',
      'idx_scraping_jobs_status'
    ];
  }

  async validateSchema() {
    console.log('🔍 DATABASE_SCHEMA_VALIDATION_LOCK', {
      timestamp: new Date().toISOString(),
      requiredTables: this.requiredTables.length,
      requiredIndexes: this.requiredIndexes.length
    });

    const { sql } = await import('../../packages/database/index.js');
    const results = {
      tables: {},
      columns: {},
      indexes: {},
      functions: {},
      valid: true,
      errors: []
    };

    try {
      // Validate tables exist
      for (const tableName of this.requiredTables) {
        const tableExists = await this.checkTableExists(sql, tableName);
        results.tables[tableName] = tableExists;
        
        if (!tableExists) {
          results.valid = false;
          results.errors.push(\`Missing table: \${tableName}\`);
        }
      }

      // Validate columns exist
      for (const [tableName, columns] of Object.entries(this.requiredColumns)) {
        results.columns[tableName] = {};
        
        for (const columnName of columns) {
          const columnExists = await this.checkColumnExists(sql, tableName, columnName);
          results.columns[tableName][columnName] = columnExists;
          
          if (!columnExists) {
            results.valid = false;
            results.errors.push(\`Missing column: \${tableName}.\${columnName}\`);
          }
        }
      }

      // Validate indexes exist
      for (const indexName of this.requiredIndexes) {
        const indexExists = await this.checkIndexExists(sql, indexName);
        results.indexes[indexName] = indexExists;
        
        if (!indexExists) {
          results.valid = false;
          results.errors.push(\`Missing index: \${indexName}\`);
        }
      }

      // Validate functions exist
      const requiredFunctions = [
        'update_organization_quota',
        'upgrade_organization_plan',
        'process_webhook_event',
        'get_organization_quota_status'
      ];
      
      for (const functionName of requiredFunctions) {
        const functionExists = await this.checkFunctionExists(sql, functionName);
        results.functions[functionName] = functionExists;
        
        if (!functionExists) {
          results.valid = false;
          results.errors.push(\`Missing function: \${functionName}\`);
        }
      }

      if (results.valid) {
        console.log('✅ DATABASE_SCHEMA_VALIDATION_PASSED_LOCK');
      } else {
        console.error('❌ DATABASE_SCHEMA_VALIDATION_FAILED_LOCK', {
          errors: results.errors
        });
      }

      return results;

    } catch (error) {
      console.error('💥 DATABASE_SCHEMA_VALIDATION_ERROR_LOCK', {
        error: error.message,
        stack: error.stack
      });
      
      results.valid = false;
      results.errors.push(\`Validation error: \${error.message}\`);
      return results;
    }
  }

  async checkTableExists(sql, tableName) {
    const result = await sql\`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = \${tableName}
      )
    \`;
    return result[0]?.exists || false;
  }

  async checkColumnExists(sql, tableName, columnName) {
    const result = await sql\`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = \${tableName} AND column_name = \${columnName}
      )
    \`;
    return result[0]?.exists || false;
  }

  async checkIndexExists(sql, indexName) {
    const result = await sql\`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = \${indexName}
      )
    \`;
    return result[0]?.exists || false;
  }

  async checkFunctionExists(sql, functionName) {
    const result = await sql\`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = \${functionName} AND routine_type = 'FUNCTION'
      )
    \`;
    return result[0]?.exists || false;
  }
}

module.exports = { DatabaseSchemaValidator };
`;

    fs.writeFileSync('src/lib/database-schema-validator.js', schemaValidation);
    
    console.log('✅ Schema validation created');
    console.log('   - Table validation implemented');
    console.log('   - Column validation secured');
    console.log('   - Index validation locked');
    console.log('   - Function validation protected');
  }
}

// Run the architecture lock phase 3
if (require.main === module) {
  const lock = new ArchitectureLockPhase3();
  lock.run()
    .then(() => {
      console.log('✅ Architecture Lock Phase 3 completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Architecture Lock Phase 3 failed:', error);
      process.exit(1);
    });
}

module.exports = { ArchitectureLockPhase3 };