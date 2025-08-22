-- Pre-verification: Check state before downgrade operations
-- This should show 2 candidates for downgrade

SELECT 
  'BEFORE downgrade' as check_point,
  id,
  name,
  plan,
  billing_status,
  quota_limit,
  current_period_end,
  cancel_at_period_end,
  CASE 
    WHEN billing_status = 'canceled' THEN true
    WHEN billing_status = 'incomplete_expired' THEN true
    WHEN (cancel_at_period_end = true AND current_period_end < NOW()) THEN true
    WHEN (current_period_end < NOW() AND dodo_subscription_id IS NOT NULL) THEN true
    ELSE false
  END as is_candidate
FROM orgs 
WHERE id LIKE 'test_smoke_%'
ORDER BY id;

-- Count candidates
SELECT 
  'Candidate count' as metric,
  COUNT(*) as total_orgs,
  SUM(CASE 
    WHEN billing_status = 'canceled' THEN 1
    WHEN billing_status = 'incomplete_expired' THEN 1
    WHEN (cancel_at_period_end = true AND current_period_end < NOW()) THEN 1
    WHEN (current_period_end < NOW() AND dodo_subscription_id IS NOT NULL) THEN 1
    ELSE 0
  END) as downgrade_candidates
FROM orgs 
WHERE id LIKE 'test_smoke_%'; 