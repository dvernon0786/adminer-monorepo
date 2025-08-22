import { db } from '../db/client'
import { orgs, jobs } from '../db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import crypto from 'crypto'

export interface QuotaInfo {
  plan: string
  used: number
  limit: number
  remaining: number
  upgradeUrl: string
}

export interface QuotaCheckResult {
  allowed: boolean
  quota: QuotaInfo
  error?: {
    code: string
    message: string
    upgradeUrl: string
  }
}

// Plan limits configuration
export const PLAN_LIMITS = {
  free: 10,
  pro: 500,
  enterprise: 2000
} as const

export type PlanType = keyof typeof PLAN_LIMITS

// Get current billing period (YYYY-MM format)
export function getCurrentBillingPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Get start of billing period for current date
export function startOfBillingPeriod(d: Date): Date {
  // Simple monthly buckets; align with Dodo if you prefer using currentPeriodEnd on orgs
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0))
}

// Get quota information for an organization
export async function getQuotaInfo(orgId: string): Promise<QuotaInfo> {
  const org = await db.select().from(orgs).where(eq(orgs.id, orgId)).limit(1)
  
  if (!org.length) {
    // Create default free org if it doesn't exist
    await db.insert(orgs).values({
      id: orgId,
      name: 'My Org',
      plan: 'free',
      monthlyLimit: PLAN_LIMITS.free,
      monthlyUsage: 0,
    })
    
    return {
      plan: 'free',
      used: 0,
      limit: PLAN_LIMITS.free,
      remaining: PLAN_LIMITS.free,
      upgradeUrl: '/pricing'
    }
  }

  const orgData = org[0]
  const plan = orgData.plan as PlanType || 'free'
  const limit = orgData.monthlyLimit || PLAN_LIMITS[plan]
  
  // Get current period usage from jobs table (production-ready approach)
  const periodStart = startOfBillingPeriod(new Date())
  const [{ count }] = (await db
    .select({ count: sql`COUNT(*)` })
    .from(jobs)
    .where(and(eq(jobs.orgId, orgId), gte(jobs.createdAt, periodStart)))) as unknown as [{ count: number }]
  
  const used = Number(count ?? 0)
  const remaining = Math.max(0, limit - used)

  // Generate upgrade URL based on current plan
  let upgradeUrl = '/pricing'
  if (plan === 'free') {
    upgradeUrl = '/api/dodo/checkout?plan=pro'
  } else if (plan === 'pro') {
    upgradeUrl = '/api/dodo/checkout?plan=enterprise'
  }

  return {
    plan,
    used,
    limit,
    remaining,
    upgradeUrl
  }
}

// Check if an organization can perform an action (increment quota)
export async function checkQuota(orgId: string): Promise<QuotaCheckResult> {
  const quota = await getQuotaInfo(orgId)
  
  if (quota.used >= quota.limit) {
    return {
      allowed: false,
      quota,
      error: {
        code: 'QUOTA_EXCEEDED',
        message: `Quota exceeded. Current plan: ${quota.plan}, Used: ${quota.used}/${quota.limit}`,
        upgradeUrl: quota.upgradeUrl
      }
    }
  }

  return {
    allowed: true,
    quota
  }
}

// Increment quota usage for an organization
export async function incrementQuota(orgId: string, jobId?: string): Promise<void> {
  // Update org monthlyUsage count directly
  await db.update(orgs)
    .set({
      monthlyUsage: sql`${orgs.monthlyUsage} + 1`,
      updatedAt: new Date()
    })
    .where(eq(orgs.id, orgId))
}

// Create a job and track quota usage (production-ready approach)
export async function createJob(orgId: string, jobType: string): Promise<string> {
  const jobId = crypto.randomUUID()
  
  await db.insert(jobs).values({
    id: jobId,
    orgId: orgId,
    raw: jobType, // Using 'raw' field for job type since 'job_type' doesn't exist
    status: 'pending',
    createdAt: new Date()
  })

  // Increment quota usage
  await incrementQuota(orgId, jobId)
  
  return jobId
}

// Reset quota for new billing period (called by webhook)
export async function resetQuotaForNewPeriod(orgId: string): Promise<void> {
  await db.update(orgs)
    .set({
      monthlyUsage: 0,
      updatedAt: new Date()
    })
    .where(eq(orgs.id, orgId))
}

// Get quota usage for current billing period
export async function getCurrentPeriodUsage(orgId: string): Promise<number> {
  // Use the jobs table approach since quota_usage table doesn't exist
  return getCurrentPeriodUsageFromJobs(orgId)
}

// Get current period usage from jobs table (production-ready approach)
export async function getCurrentPeriodUsageFromJobs(orgId: string): Promise<number> {
  const periodStart = startOfBillingPeriod(new Date())
  
  const [{ count }] = (await db
    .select({ count: sql`COUNT(*)` })
    .from(jobs)
    .where(and(eq(jobs.orgId, orgId), gte(jobs.createdAt, periodStart)))) as unknown as [{ count: number }]
  
  return Number(count ?? 0)
} 