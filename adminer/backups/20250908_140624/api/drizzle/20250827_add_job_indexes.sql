-- Speed up monthly usage lookups
CREATE INDEX IF NOT EXISTS idx_jobs_org_status_created
  ON jobs (org_id, status, created_at DESC);

-- Optional: partial index if you only ever count 'completed'
CREATE INDEX IF NOT EXISTS idx_jobs_completed_month
  ON jobs (org_id, created_at DESC)
  WHERE status = 'completed'; 