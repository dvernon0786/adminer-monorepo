// apps/api/src/db/schema.ts
import { pgEnum, pgTable, text, timestamp, varchar, integer, boolean, primaryKey, date, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);

export const orgs = pgTable("orgs", {
  id: varchar("id", { length: 64 }).primaryKey(),                  // your org id (Clerk org ID or internal)
  externalId: text("external_id")                                  // external identifier for webhook lookups
    .notNull()
    .default(sql`gen_random_uuid()::text`)
    .unique(),
  name: varchar("name", { length: 256 }).notNull(),
  // Billing
  plan: planEnum("plan").notNull().default("free"),
  dodoCustomerId: varchar("dodo_customer_id", { length: 128 }),     // external customer
  dodoSubscriptionId: varchar("dodo_subscription_id", { length: 128 }),
  subscriptionStatus: varchar("subscription_status", { length: 64 }).default("inactive"),
  currentPeriodEnd: timestamp("current_period_end"),                // next renewal / grace calc
  canceledAt: timestamp("canceled_at"),                             // cancellation timestamp
  // Quota counters with proper monthly window tracking
  quota_monthly: integer("quota_monthly").notNull().default(10),     // free=10, pro=500, enterprise=2000
  quota_used_month: integer("quota_used_month").notNull().default(0),
  quota_month: date("quota_month").notNull().default(sql`date_trunc('month', now())::date`),
  // Legacy fields (kept for backward compatibility during migration)
  monthlyUsage: integer("monthly_usage").notNull().default(0),
  monthlyLimit: integer("monthly_limit").notNull().default(10),
  // Bookkeeping
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id", { length: 128 }).primaryKey(),                  // event id from Dodo
  source: varchar("source", { length: 64 }).notNull().default("dodo"),
  seenAt: timestamp("seen_at").notNull().defaultNow(),
});

// Comprehensive jobs table for complete job lifecycle management
export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 36 }).primaryKey(),                    // uuid v4 string
  orgId: varchar("org_id", { length: 64 }).notNull().references(() => orgs.id, { onDelete: "cascade" }),
  requestedBy: varchar("requested_by", { length: 64 }).notNull(),    // Clerk userId
  keyword: text("keyword").notNull(),                               // search keyword for ad analysis
  status: varchar("status", { length: 32 }).notNull().default("queued"), // queued|running|completed|failed
  apifyRunId: varchar("apify_run_id", { length: 64 }),              // Apify run ID for tracking
  input: jsonb("input").$type<Record<string, any>>().default({}),   // job input parameters
  rawData: jsonb("raw_data").$type<any>().default(null),            // raw scraped data from Apify
  
  // Quota tracking - new ads-based system
  adsRequested: integer("ads_requested").notNull().default(0),      // how many ads the requester wanted to fetch
  adsImported: integer("ads_imported").notNull().default(0),        // how many we actually imported after applying caps/quota
  quotaDebit: integer("quota_debit").notNull().default(0),          // quota units consumed (equals adsImported for Pro/Ent, 0 for Free)
  
  // Derived / normalized columns from raw_data
  adArchiveId: varchar("ad_archive_id", { length: 64 }),
  pageProfileUri: text("page_profile_uri"),
  pageId: varchar("page_id", { length: 64 }),
  pageName: text("page_name"),
  contentType: varchar("content_type", { length: 24 }), // "text" | "image+text" | "text+video"
  isActive: boolean("is_active"),
  
  // Text strategy analysis (GPT-4o Mini)
  summary: text("summary"),
  rewrittenAdCopy: text("rewritten_ad_copy"),
  keyInsights: jsonb("key_insights").$type<string[] | null>().default(null),
  competitorStrategy: text("competitor_strategy"),
  recommendations: jsonb("recommendations").$type<string[] | null>().default(null),
  
  // Model prompts/outputs for image / video analysis
  imagePrompt: jsonb("image_prompt").$type<any>().default(null), // GPT-4o vision result JSON
  videoPrompt: jsonb("video_prompt").$type<any>().default(null), // Gemini 1.5 flash result JSON
  
  error: text("error"),                                             // error message if job failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orgsRelations = relations(orgs, ({ many }) => ({
  jobs: many(jobs), // one org can have many jobs
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  org: one(orgs, {
    fields: [jobs.orgId],
    references: [orgs.id],
  }),
}));

export type Org = typeof orgs.$inferSelect
export type NewOrg = typeof orgs.$inferInsert
export type WebhookEvent = typeof webhookEvents.$inferSelect
export type NewWebhookEvent = typeof webhookEvents.$inferInsert
export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert

// Enhanced quota types for better type safety
export interface QuotaStatus {
  ok: boolean
  reason?: string
  remaining?: number
  plan?: string
  used?: number
}

// Job status types for type safety
export type JobStatus = "queued" | "running" | "completed" | "failed"

// Job analysis result types
export interface JobAnalysis {
  winnerScore: number
  highlights: string[]
  reasons: string
  timestamp: string
  model: string
}

// Job input types
export interface JobInput {
  keyword: string
  additionalParams?: Record<string, any>
  priority?: "low" | "normal" | "high"
} 