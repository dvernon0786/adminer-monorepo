-- Migration: Add orgs.external_id with production-safe backfilling
-- This migration ensures every org gets a unique external_id for webhook lookups

-- 1) Ensure gen_random_uuid() exists (pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Add column with a DEFAULT for new rows
ALTER TABLE orgs
ADD COLUMN external_id TEXT DEFAULT gen_random_uuid()::text;

-- 3) Backfill existing rows that are NULL (older rows created before this migration)
UPDATE orgs
SET external_id = gen_random_uuid()::text
WHERE external_id IS NULL;

-- 4) Enforce NOT NULL
ALTER TABLE orgs
ALTER COLUMN external_id SET NOT NULL;

-- 5) Enforce UNIQUE
ALTER TABLE orgs
ADD CONSTRAINT orgs_external_id_unique UNIQUE (external_id);

-- 6) Create index for performance
CREATE INDEX idx_orgs_external_id ON orgs(external_id); 