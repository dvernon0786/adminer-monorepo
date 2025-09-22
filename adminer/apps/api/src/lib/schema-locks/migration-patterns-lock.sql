
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
