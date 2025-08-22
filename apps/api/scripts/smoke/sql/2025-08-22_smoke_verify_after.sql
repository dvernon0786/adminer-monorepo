-- Post-verification: Check state after downgrade operations
-- This should show the downgraded organizations and verify changes

SELECT 
  'AFTER downgrade' as check_point,
  id,
  name,
  plan,
  billing_status,
  quota_limit,
  current_period_end,
  updated_at
FROM orgs 
WHERE id LIKE 'test_smoke_%'
ORDER BY id;

-- Verify downgrade results with boolean checks
SELECT 
  'Verification checks' as check_type,
  -- test_smoke_canceled should be downgraded
  (SELECT 
    plan = 'free' AND 
    quota_limit = 10 AND 
    billing_status = 'canceled_downgraded'
   FROM orgs WHERE id = 'test_smoke_canceled'
  ) as test_canceled_downgraded_ok,
  
  -- test_smoke_cancel_at_period_end should be downgraded
  (SELECT 
    plan = 'free' AND 
    quota_limit = 10 AND 
    billing_status = 'canceled_downgraded'
   FROM orgs WHERE id = 'test_smoke_cancel_at_period_end'
  ) as test_cancel_at_period_end_downgraded_ok,
  
  -- test_smoke_active should remain unchanged
  (SELECT 
    plan = 'pro' AND 
    quota_limit = 500 AND 
    billing_status = 'active'
   FROM orgs WHERE id = 'test_smoke_active'
  ) as test_active_unchanged_ok;

-- Summary
SELECT 
  'Summary' as metric,
  COUNT(*) as total_orgs,
  COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_orgs,
  COUNT(CASE WHEN billing_status = 'canceled_downgraded' THEN 1 END) as downgraded_orgs
FROM orgs 
WHERE id LIKE 'test_smoke_%'; 