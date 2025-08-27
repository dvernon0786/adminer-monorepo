import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),             // webhook-id (unique)
  type: text("type").notNull(),            // event type
  raw: text("raw"),                        // raw payload (optional)
  receivedAt: timestamp("received_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}); 