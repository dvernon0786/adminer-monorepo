-- Canonical SQL view for billing downgrade candidates
-- Keeps the logic in one place (reused by endpoint, cron, diagnostics)
-- Run this once: psql "$DATABASE_URL" -f adminer/apps/api/scripts/2025-08-22_billing_view.sql

create or replace view billing_downgrade_candidates as
select 
  id, 
  name, 
  plan, 
  billing_status, 
  cancel_at_period_end, 
  current_period_end,
  created_at,
  updated_at
from orgs
where
  billing_status = 'canceled'
  or (
    coalesce(cancel_at_period_end, false) = true
    and current_period_end is not null
    and current_period_end < now()
  );

-- Grant access to the view
grant select on billing_downgrade_candidates to public;

-- Verify the view was created
select 
  schemaname,
  viewname,
  definition
from pg_views 
where viewname = 'billing_downgrade_candidates';

-- Test the view
select count(*) as candidate_count from billing_downgrade_candidates; 