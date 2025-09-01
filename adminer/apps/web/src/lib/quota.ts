export type QuotaStatus =
  | { ok: true; plan: string; used: number; limit: number }
  | { ok: false; code: 401; reason: "unauthenticated" }
  | { ok: false; code: 402; reason: "quota_exceeded"; upgradeUrl: string }
  | { ok: false; code: number; reason: string };

export async function getQuotaStatus(): Promise<QuotaStatus> {
  // Mock response for static deployment - API functions removed
  // TODO: Replace with external API service or re-implement serverless functions later
  
  // Simulate network delay for realistic behavior
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Return mock quota data with realistic values
  return {
    ok: true,
    plan: "free",
    used: 45,
    limit: 100
  };
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