-- Idempotent creation of billing_audit table for downgrade audit trails
-- Run this once: psql "$DATABASE_URL" -f adminer/apps/api/scripts/2025-08-22_billing_audit.sql

create table if not exists billing_audit (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  org_id text not null,
  org_slug text,
  previous_plan text,
  new_plan text,
  previous_billing_status text,
  new_billing_status text,
  reason text,             -- e.g. 'canceled', 'cancel_at_period_end_expired'
  dry_run boolean default false,
  meta jsonb default '{}'::jsonb
);

create index if not exists billing_audit_occurred_at_idx on billing_audit (occurred_at desc);
create index if not exists billing_audit_org_id_idx on billing_audit (org_id);

-- Verify the table was created
select 
  'billing_audit table created' as status,
  count(*) as row_count 
from billing_audit; 