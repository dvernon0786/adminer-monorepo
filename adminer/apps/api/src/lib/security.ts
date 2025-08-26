/**
 * Security utilities for safe environment variable handling
 * Prevents secret leaks in error messages, logs, and stack traces
 */

const MAX_KEYS_SHOWN = parseInt(process.env.MAX_KEYS_SHOWN || '50', 10);

/**
 * Safely redact environment variable values
 * @param value - The value to redact
 * @param pattern - Optional regex pattern to match sensitive keys
 * @returns Redacted value
 */
export function redact(value: string | undefined, pattern?: RegExp): string {
  if (!value) return '';
  
  // Default sensitive patterns
  const sensitivePatterns = pattern || /(key|secret|token|password|auth|credential)/i;
  
  if (sensitivePatterns.test(value)) {
    return '***';
  }
  
  // Redact if it looks like a sensitive value
  if (value.length > 20 || value.includes('sk_') || value.includes('pk_')) {
    return value.substring(0, 4) + '***' + value.substring(value.length - 4);
  }
  
  return value;
}

/**
 * Safely get environment variable summary without exposing values
 * @param keys - Array of environment variable keys to check
 * @returns Safe summary object
 */
export function getEnvSummary(keys: string[]): Record<string, string> {
  const summary: Record<string, string> = {};
  
  // Limit the number of keys shown to prevent noisy logs
  const limitedKeys = keys.slice(0, MAX_KEYS_SHOWN);
  
  for (const key of limitedKeys) {
    const value = process.env[key];
    if (value) {
      summary[key] = redact(value, /(key|secret|token|password|auth|credential)/i);
    } else {
      summary[key] = 'NOT_SET';
    }
  }
  
  if (keys.length > MAX_KEYS_SHOWN) {
    summary['_note'] = `... and ${keys.length - MAX_KEYS_SHOWN} more keys (truncated)`;
  }
  
  return summary;
}

/**
 * Safe environment variable getter that never exposes raw values
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns Safe representation of the value
 */
export function getSafeEnv(key: string, defaultValue: string = 'NOT_SET'): string {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  return redact(value, /(key|secret|token|password|auth|credential)/i);
}

/**
 * Check if environment variable is set without exposing its value
 * @param key - Environment variable key
 * @returns Boolean indicating if the variable is set
 */
export function hasEnv(key: string): boolean {
  return !!process.env[key];
}

/**
 * Get environment variable count for debugging (safe)
 * @returns Number of environment variables set
 */
export function getEnvCount(): number {
  return Object.keys(process.env).length;
}

/**
 * Validate that no sensitive environment variables are exposed
 * @param obj - Object to validate
 * @returns Boolean indicating if the object is safe
 */
export function validateNoSecrets(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return true;
  
  const jsonStr = JSON.stringify(obj);
  
  // Check for common secret patterns
  const secretPatterns = [
    /sk_[a-zA-Z0-9]{20,}/,           // Stripe/OpenAI secret keys
    /pk_[a-zA-Z0-9]{20,}/,           // Stripe/OpenAI publishable keys
    /ghp_[a-zA-Z0-9]{30,}/,          // GitHub tokens
    /xoxb-[0-9A-Za-z\-]{20,}/,       // Slack bot tokens
    /AKIA[0-9A-Z]{16}/,              // AWS access keys
    /-----BEGIN (RSA|PRIVATE|OPENSSH) KEY-----/, // Private keys
  ];
  
  return !secretPatterns.some(pattern => pattern.test(jsonStr));
}

/**
 * Safe error message formatter that never includes environment variables
 * @param message - Error message
 * @param context - Optional context object (will be sanitized)
 * @returns Safe error message
 */
export function formatSafeError(message: string, context?: any): string {
  let safeMessage = message;
  
  if (context) {
    // Create a safe context by removing any process.env references
    const safeContext = { ...context };
    
    // Remove any properties that might contain environment variables
    Object.keys(safeContext).forEach(key => {
      if (typeof safeContext[key] === 'string' && safeContext[key].includes('process.env')) {
        safeContext[key] = '[REDACTED]';
      }
    });
    
    safeMessage += ` | Context: ${JSON.stringify(safeContext)}`;
  }
  
  return safeMessage;
}

/**
 * Environment variable access logger for debugging
 * @param key - Environment variable key being accessed
 * @param safe - Whether the access was safe (no value exposure)
 */
export function logEnvAccess(key: string, safe: boolean = true): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ENV_ACCESS] ${key}: ${safe ? 'SAFE' : 'UNSAFE'}`);
  }
} 