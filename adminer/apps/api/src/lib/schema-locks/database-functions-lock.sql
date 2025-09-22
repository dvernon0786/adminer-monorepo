
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
