import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const orgs = pgTable('orgs', {
  id: text('id').primaryKey(),          // Clerk orgId or internal
  name: text('name'),
  plan: text('plan').default('free'),
  quota_limit: integer('quota_limit').default(10),
  quota_used: integer('quota_used').default(0),
  dodo_customer_id: text('dodo_customer_id'),
  dodo_subscription_id: text('dodo_subscription_id'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export type Org = typeof orgs.$inferSelect
export type NewOrg = typeof orgs.$inferInsert 