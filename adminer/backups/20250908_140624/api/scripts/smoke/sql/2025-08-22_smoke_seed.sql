-- Smoke test seed data for billing downgrade testing
-- This creates test organizations with different billing statuses

-- Clear any existing test data
DELETE FROM orgs WHERE id LIKE 'test_smoke_%';

-- Insert test organizations
INSERT INTO orgs (id, name, plan, billing_status, quota_limit, current_period_end, cancel_at_period_end, created_at, updated_at) VALUES
  ('test_smoke_canceled', 'Test Canceled Org', 'pro', 'canceled', 500, NULL, false, NOW(), NOW()),
  ('test_smoke_cancel_at_period_end', 'Test Cancel At Period End', 'enterprise', 'active', 2000, NOW() - INTERVAL '1 day', true, NOW(), NOW()),
  ('test_smoke_active', 'Test Active Org', 'pro', 'active', 500, NOW() + INTERVAL '30 days', false, NOW(), NOW());

-- Verify the seed data
SELECT 'Seed data inserted' as status, COUNT(*) as org_count FROM orgs WHERE id LIKE 'test_smoke_%'; 