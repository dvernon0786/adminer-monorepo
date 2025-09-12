export type QuotaStatus =
  | { ok: true; plan: string; used: number; limit: number }
  | { ok: false; code: 401; reason: "unauthenticated" }
  | { ok: false; code: 402; reason: "quota_exceeded"; upgradeUrl: string }
  | { ok: false; code: number; reason: string };

export async function getQuotaStatus(): Promise<QuotaStatus> {
  try {
    // Call real API endpoint
    const response = await fetch('/api/quota', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { ok: false, code: 401, reason: "unauthenticated" };
      }
      if (response.status === 402) {
        return { ok: false, code: 402, reason: "quota_exceeded", upgradeUrl: "/billing" };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        ok: true,
        plan: data.data.plan || "free",
        used: data.data.used || 0,
        limit: data.data.limit || 100
      };
    } else {
      throw new Error(data.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Failed to fetch quota status:', error);
    // Return default values on error
    return {
      ok: true,
      plan: "free",
      used: 0,
      limit: 100
    };
  }
}

// Legacy compatibility - returns the old format for existing components
export async function getQuota() {
  const quota = await getQuotaStatus();
  if (quota.ok) {
    return quota;
  }
  
  // Convert error responses to throw for backward compatibility
  if (quota.code === 401) {
    throw new Error("Authentication required");
  }
  if (quota.code === 402) {
    throw new Error("Quota exceeded");
  }
  throw new Error(`Quota fetch failed: ${quota.reason}`);
} 