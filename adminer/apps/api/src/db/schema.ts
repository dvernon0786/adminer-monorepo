import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';

// Organizations table - stores company/team information
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').notNull().unique(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'), // free, pro, enterprise
  quotaLimit: integer('quota_limit').notNull().default(100),
  quotaUsed: integer('quota_used').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Jobs table - stores job execution history and status
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  type: text('type').notNull(), // 'scrape', 'analyze', 'export'
  status: text('status').notNull().default('pending'), // pending, running, completed, failed
  input: jsonb('input').notNull(), // job parameters
  output: jsonb('output'), // job results
  error: text('error'), // error message if failed
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Quota usage tracking - detailed quota consumption
export const quotaUsage = pgTable('quota_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  jobId: uuid('job_id').references(() => jobs.id),
  type: text('type').notNull(), // 'scrape', 'analyze', 'export'
  amount: integer('amount').notNull(), // quota units consumed
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payment subscriptions - tracks payment status
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  dodoSubscriptionId: text('dodo_subscription_id').unique(),
  plan: text('plan').notNull(), // free, pro, enterprise
  status: text('status').notNull().default('active'), // active, cancelled, past_due
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Webhook events - tracks payment and system events
export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(), // 'subscription_created', 'subscription_updated', 'payment_succeeded'
  source: text('source').notNull(), // 'dodo', 'inngest', 'system'
  data: jsonb('data').notNull(), // webhook payload
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Export types for TypeScript
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type QuotaUsage = typeof quotaUsage.$inferSelect;
export type NewQuotaUsage = typeof quotaUsage.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;