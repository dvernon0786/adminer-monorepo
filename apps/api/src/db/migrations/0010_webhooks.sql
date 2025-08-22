-- apps/api/drizzle/0010_webhooks.sql
CREATE TABLE IF NOT EXISTS webhook_events (
  id VARCHAR(128) PRIMARY KEY,
  source VARCHAR(64) NOT NULL DEFAULT 'dodo',
  seen_at TIMESTAMP NOT NULL DEFAULT NOW()
); 