ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
CREATE INDEX IF NOT EXISTS idx_orgs_period_end ON orgs(current_period_end);
CREATE INDEX IF NOT EXISTS idx_orgs_status_period ON orgs(billing_status, current_period_end); 