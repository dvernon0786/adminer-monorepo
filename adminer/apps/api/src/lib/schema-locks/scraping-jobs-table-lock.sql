
-- Scraping Jobs Table Schema Lock - Architecture Lock Phase 3
-- This file locks the scraping_jobs table structure to prevent regression

CREATE TABLE IF NOT EXISTS scraping_jobs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Reference
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Job Information
  keyword VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Apify Integration
  apify_run_id VARCHAR(255),
  apify_actor_id VARCHAR(255),
  
  -- Results
  results_count INTEGER DEFAULT 0,
  results_data JSONB,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Scraping Jobs Table Indexes Lock
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_org_id ON scraping_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_keyword ON scraping_jobs(keyword);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at);

-- Scraping Jobs Table Comments Lock
COMMENT ON TABLE scraping_jobs IS 'Scraping jobs table - LOCKED: Do not modify structure';
COMMENT ON COLUMN scraping_jobs.org_id IS 'Organization reference - LOCKED';
COMMENT ON COLUMN scraping_jobs.keyword IS 'Search keyword - LOCKED';
COMMENT ON COLUMN scraping_jobs.status IS 'Job status - LOCKED';
COMMENT ON COLUMN scraping_jobs.apify_run_id IS 'Apify run ID - LOCKED';
COMMENT ON COLUMN scraping_jobs.results_data IS 'Scraping results - LOCKED';
