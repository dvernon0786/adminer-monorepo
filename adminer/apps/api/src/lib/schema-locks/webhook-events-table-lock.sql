
-- Webhook Events Table Schema Lock - Architecture Lock Phase 3
-- This file locks the webhook_events table structure to prevent regression

CREATE TABLE IF NOT EXISTS webhook_events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Information
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) UNIQUE,
  
  -- Organization Reference
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Event Data
  data JSONB NOT NULL,
  
  -- Processing Status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook Events Table Indexes Lock
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_org_id ON webhook_events(org_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- Webhook Events Table Comments Lock
COMMENT ON TABLE webhook_events IS 'Webhook events table - LOCKED: Do not modify structure';
COMMENT ON COLUMN webhook_events.event_type IS 'Event type - LOCKED';
COMMENT ON COLUMN webhook_events.event_id IS 'Unique event ID - LOCKED';
COMMENT ON COLUMN webhook_events.org_id IS 'Organization reference - LOCKED';
COMMENT ON COLUMN webhook_events.data IS 'Event data JSON - LOCKED';
COMMENT ON COLUMN webhook_events.processed IS 'Processing status - LOCKED';
