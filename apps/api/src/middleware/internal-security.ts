import { NextApiRequest, NextApiResponse } from 'next';
import { getSafeEnv } from '../../lib/security';

// In-memory rate limiting (simple but effective for internal endpoints)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

/**
 * Middleware for securing internal endpoints
 * - Checks if internal endpoints are enabled
 * - Validates internal token for preview environments
 * - Applies rate limiting
 * - Disables in production by default
 */
export function internalSecurityMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = !!process.env.VERCEL;
  const vercelEnv = process.env.VERCEL_ENV;
  
  // Check if internal endpoints are enabled
  const internalEnabled = process.env.INTERNAL_ENDPOINTS_ENABLED === 'true';
  
  // Production safety: disable by default unless explicitly enabled
  if (isProduction && !internalEnabled) {
    return res.status(404).json({
      error: 'Internal endpoints disabled in production',
      message: 'Set INTERNAL_ENDPOINTS_ENABLED=true to enable (not recommended)'
    });
  }
  
  // Preview/development: require token validation
  if (!isProduction || vercelEnv === 'preview') {
    const internalToken = req.headers['x-internal-token'];
    const expectedToken = process.env.INTERNAL_TOKEN;
    
    if (!expectedToken) {
      return res.status(500).json({
        error: 'Internal token not configured',
        message: 'Set INTERNAL_TOKEN environment variable'
      });
    }
    
    if (!internalToken || internalToken !== expectedToken) {
      return res.status(401).json({
        error: 'Invalid internal token',
        message: 'Include valid X-Internal-Token header'
      });
    }
  }
  
  // Rate limiting for all internal endpoints
  const clientId = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const rateLimitKey = `internal:${clientId}`;
  
  const now = Date.now();
  const clientRateLimit = rateLimitStore.get(rateLimitKey);
  
  if (clientRateLimit && now < clientRateLimit.resetTime) {
    if (clientRateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${RATE_LIMIT_MAX_REQUESTS} per minute`,
        retryAfter: Math.ceil((clientRateLimit.resetTime - now) / 1000)
      });
    }
    clientRateLimit.count++;
  } else {
    rateLimitStore.set(rateLimitKey, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
  }
  
  // Clean up old rate limit entries
  if (Math.random() < 0.1) { // 10% chance to clean up
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Continue to the actual endpoint
  next();
}

/**
 * Higher-order function to wrap internal endpoints with security
 */
export function withInternalSecurity<T = any>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<T> | T
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Apply security middleware
    internalSecurityMiddleware(req, res, () => {
      // Security passed, call the handler
      return handler(req, res);
    });
  };
}

/**
 * Check if internal endpoints are accessible in current environment
 */
export function canAccessInternal(): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const internalEnabled = process.env.INTERNAL_ENDPOINTS_ENABLED === 'true';
  
  if (isProduction) {
    return internalEnabled;
  }
  
  return true; // Always accessible in development/preview
}

/**
 * Get internal endpoint status for debugging
 */
export function getInternalStatus() {
  return {
    enabled: process.env.INTERNAL_ENDPOINTS_ENABLED === 'true',
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    requiresToken: !process.env.NODE_ENV || process.env.VERCEL_ENV === 'preview',
    tokenConfigured: !!process.env.INTERNAL_TOKEN,
    rateLimit: {
      window: RATE_LIMIT_WINDOW,
      maxRequests: RATE_LIMIT_MAX_REQUESTS
    }
  };
} 