export type QuotaStatus =
  | { ok: true; plan: string; used: number; limit: number }
  | { ok: false; code: 401; reason: "unauthenticated" }
  | { ok: false; code: 402; reason: "quota_exceeded"; upgradeUrl: string }
  | { ok: false; code: number; reason: string };

export async function getQuotaStatus(): Promise<QuotaStatus> {
  const res = await fetch("/api/consolidated?action=quota/status", {
    method: "GET",
    // same-origin includes cookies for Clerk
    credentials: "same-origin",
    headers: { "accept": "application/json" },
  }).catch(() => null);

  if (!res) return { ok: false, code: 0, reason: "network_error" };

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (res.status === 200) {
    const { plan, used, limit } = data;
    return { ok: true, plan, used, limit };
  }
  if (res.status === 401) {
    return { ok: false, code: 401, reason: "unauthenticated" };
  }
  if (res.status === 402) {
    const upgradeUrl = data?.upgradeUrl ?? "/pricing";
    return { ok: false, code: 402, reason: "quota_exceeded", upgradeUrl };
  }
  return { ok: false, code: res.status, reason: data?.error ?? "unknown_error" };
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