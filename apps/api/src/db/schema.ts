// apps/api/src/db/schema.ts
import { pgEnum, pgTable, text, timestamp, varchar, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);

export const orgs = pgTable("orgs", {
  id: varchar("id", { length: 64 }).primaryKey(),                  // your org id (Clerk org ID or internal)
  name: varchar("name", { length: 256 }).notNull(),
  // Billing
  plan: planEnum("plan").notNull().default("free"),
  dodoCustomerId: varchar("dodo_customer_id", { length: 128 }),     // external customer
  dodoSubscriptionId: varchar("dodo_subscription_id", { length: 128 }),
  subscriptionStatus: varchar("subscription_status", { length: 64 }).default("inactive"),
  currentPeriodEnd: timestamp("current_period_end"),                // next renewal / grace calc
  canceledAt: timestamp("canceled_at"),                             // cancellation timestamp
  // Quota counters (reset daily or monthly by your job if needed)
  monthlyUsage: integer("monthly_usage").notNull().default(0),
  monthlyLimit: integer("monthly_limit").notNull().default(10),     // free=10, pro=500, enterprise=2000
  // Bookkeeping
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id", { length: 128 }).primaryKey(),                  // event id from Dodo
  source: varchar("source", { length: 64 }).notNull().default("dodo"),
  seenAt: timestamp("seen_at").notNull().defaultNow(),
});

// Example jobs (if not already present)
export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgId: varchar("org_id", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("queued"),
  raw: text("raw"),
  analysis: text("analysis"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orgsRelations = relations(orgs, ({ many }) => ({
  // if you relate jobs -> orgs
}));

export type Org = typeof orgs.$inferSelect
export type NewOrg = typeof orgs.$inferInsert
export type WebhookEvent = typeof webhookEvents.$inferSelect
export type NewWebhookEvent = typeof webhookEvents.$inferInsert
export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert 