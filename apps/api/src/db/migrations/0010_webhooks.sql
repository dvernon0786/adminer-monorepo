-- Migration: 0010_webhooks.sql
-- Create webhook events table for idempotency

CREATE TABLE IF NOT EXISTS webhook_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at); 