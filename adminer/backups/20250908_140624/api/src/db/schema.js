import { pgTable, text, integer, timestamp, boolean, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const orgs = pgTable('orgs', {
  id: text('id').primaryKey(),
  name: text('name'),
  plan: text('plan').default('free'),
  status: text('status').default('active'),
  quotaLimit: integer('quota_limit').default(10),
  quotaUsed: integer('quota_used').default(0),
  dodoCustomerId: text('dodo_customer_id'),
  dodoSubscriptionId: text('dodo_subscription_id'),
  currentPeriodEnd: timestamp('current_period_end'),
  planCode: text('plan_code'),
  externalId: text('external_id').notNull().unique(),
  billingStatus: text('billing_status'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const plans = pgTable('plans', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  monthlyQuota: integer('monthly_quota').notNull(),
});

export const usage = pgTable('usage', {
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  yyyymm: text('yyyymm').notNull(),
  used: integer('used').notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.orgId, table.yyyymm] }),
}));

export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  orgId: text('org_id').notNull(),
  processedAt: timestamp('processed_at').defaultNow(),
  data: text('data'),
  type: text('type'),
  payload: jsonb('payload'),
  receivedAt: timestamp('received_at'),
});

export const quotaUsage = pgTable('quota_usage', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull(),
  jobId: text('job_id'),
  createdAt: timestamp('created_at').defaultNow(),
  billingPeriod: text('billing_period').notNull(),
});

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  jobType: text('job_type'),
  status: text('status').default('pending'),
  result: jsonb('result'),
  adsRequested: integer('ads_requested'),
  adsImported: integer('ads_imported'),
  quotaDebit: integer('quota_debit'),
});
