import { db } from '../db/client'
import { orgs, quota_usage } from '../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'

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

// Get quota information for an organization
export async function getQuotaInfo(orgId: string): Promise<QuotaInfo> {
  const org = await db.select().from(orgs).where(eq(orgs.id, orgId)).limit(1)
  
  if (!org.length) {
    // Create default free org if it doesn't exist
    await db.insert(orgs).values({
      id: orgId,
      name: 'My Org',
      plan: 'free',
      quota_limit: PLAN_LIMITS.free,
      quota_used: 0,
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
  const limit = orgData.quota_limit || PLAN_LIMITS[plan]
  const used = orgData.quota_used || 0
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
  const billingPeriod = getCurrentBillingPeriod()
  
  // Add quota usage record
  await db.insert(quota_usage).values({
    id: crypto.randomUUID(),
    org_id: orgId,
    job_id: jobId,
    billing_period: billingPeriod
  })

  // Update org quota_used count
  await db.update(orgs)
    .set({
      quota_used: db.raw(`quota_used + 1`),
      updated_at: new Date()
    })
    .where(eq(orgs.id, orgId))
}

// Reset quota for new billing period (called by webhook)
export async function resetQuotaForNewPeriod(orgId: string): Promise<void> {
  await db.update(orgs)
    .set({
      quota_used: 0,
      updated_at: new Date()
    })
    .where(eq(orgs.id, orgId))
}

// Get quota usage for current billing period
export async function getCurrentPeriodUsage(orgId: string): Promise<number> {
  const billingPeriod = getCurrentBillingPeriod()
  
  const result = await db.select({ count: db.raw('COUNT(*)') })
    .from(quota_usage)
    .where(
      and(
        eq(quota_usage.org_id, orgId),
        eq(quota_usage.billing_period, billingPeriod)
      )
    )
  
  return result[0]?.count || 0
} 