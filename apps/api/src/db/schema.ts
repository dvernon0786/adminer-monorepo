import { pgTable, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'

export const orgs = pgTable('orgs', {
  id: text('id').primaryKey(),          // Clerk orgId or internal
  name: text('name'),
  plan: text('plan').default('free'),   // 'free', 'pro', 'enterprise'
  status: text('status').default('active'), // 'active', 'canceled', 'past_due', 'trialing'
  billing_status: text('billing_status'), // 'active', 'canceled', 'past_due' - for Dodo webhook
  quota_limit: integer('quota_limit').default(10),
  quota_used: integer('quota_used').default(0),
  dodo_customer_id: text('dodo_customer_id'),
  dodo_subscription_id: text('dodo_subscription_id'),
  external_customer_id: text('external_customer_id'), // For Dodo webhook correlation
  current_period_end: timestamp('current_period_end'),
  cancel_at_period_end: boolean('cancel_at_period_end').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const webhook_events = pgTable('webhook_events', {
  id: text('id').primaryKey(),          // Dodo event ID for idempotency
  type: text('type').notNull(),         // Event type (subscription.activated, etc.)
  payload: jsonb('payload').notNull(),  // Full webhook payload
  received_at: timestamp('received_at').defaultNow(), // When webhook was received
})

export const quota_usage = pgTable('quota_usage', {
  id: text('id').primaryKey(),          // UUID
  org_id: text('org_id').notNull(),
  job_id: text('job_id'),               // Reference to actual job
  created_at: timestamp('created_at').defaultNow(),
  billing_period: text('billing_period').notNull(), // YYYY-MM format
})

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  org_id: text('org_id').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  job_type: text('job_type'),
  status: text('status').default('pending'),
  result: jsonb('result'),
})

export type Org = typeof orgs.$inferSelect
export type NewOrg = typeof orgs.$inferInsert
export type WebhookEvent = typeof webhook_events.$inferSelect
export type NewWebhookEvent = typeof webhook_events.$inferInsert
export type QuotaUsage = typeof quota_usage.$inferSelect
export type NewQuotaUsage = typeof quota_usage.$inferInsert
export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert 