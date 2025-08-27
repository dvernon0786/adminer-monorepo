CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" text PRIMARY KEY,
  "type" text NOT NULL,
  "raw" text,
  "received_at" timestamptz NOT NULL DEFAULT now()
); 