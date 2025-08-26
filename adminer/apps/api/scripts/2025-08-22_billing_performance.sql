-- Performance indexes for billing candidate queries
-- Run this once: psql "$DATABASE_URL" -f adminer/apps/api/scripts/2025-08-22_billing_performance.sql

-- Canceled fast path
create index if not exists orgs_billing_status_idx
  on orgs (billing_status);

-- Cancel-at-period-end fast path (partial to keep it small)
create index if not exists orgs_cap_end_active_idx
  on orgs (current_period_end)
  where cancel_at_period_end = true;

-- Composite for reporting lists
create index if not exists orgs_candidate_scan_idx
  on orgs (cancel_at_period_end, current_period_end, billing_status);

-- Verify indexes were created
select 
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes 
where tablename = 'orgs' 
  and indexname like '%billing%' or indexname like '%cap_end%' or indexname like '%candidate%'
order by indexname; 