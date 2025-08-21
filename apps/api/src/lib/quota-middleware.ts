import { NextApiRequest, NextApiResponse } from 'next'
import { checkQuota, incrementQuota } from './quota'

export interface QuotaMiddlewareOptions {
  incrementOnSuccess?: boolean
  jobIdField?: string
}

export function withQuotaCheck(options: QuotaMiddlewareOptions = {}) {
  return function(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      // Get org ID from Clerk auth
      const { orgId } = req as any
      if (!orgId) {
        return res.status(401).json({ error: 'Organization context required' })
      }

      // Check if billing is enabled
      const billingEnabled = process.env.BILLING_ENABLED !== 'false'
      if (!billingEnabled) {
        // Billing disabled - allow all requests
        return handler(req, res)
      }

      // Check quota
      const quotaResult = await checkQuota(orgId)
      if (!quotaResult.allowed) {
        return res.status(402).json({
          code: 'QUOTA_EXCEEDED',
          message: quotaResult.error!.message,
          plan: quotaResult.quota.plan,
          limit: quotaResult.quota.limit,
          used: quotaResult.quota.used,
          upgradeUrl: quotaResult.quota.upgradeUrl
        })
      }

      // Quota check passed - call the original handler
      try {
        await handler(req, res)
        
        // If successful and incrementOnSuccess is true, increment quota
        if (options.incrementOnSuccess && res.statusCode >= 200 && res.statusCode < 300) {
          const jobId = options.jobIdField ? (req.body as any)?.[options.jobIdField] : undefined
          await incrementQuota(orgId, jobId)
        }
      } catch (error) {
        // Don't increment quota on error
        throw error
      }
    }
  }
}

// Helper function to get org ID from Clerk auth
export function getOrgIdFromRequest(req: NextApiRequest): string | null {
  // This would be populated by Clerk middleware
  return (req as any).orgId || null
} 