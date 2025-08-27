import { useCallback, useEffect, useMemo, useState } from "react";
import { getQuotaStatus, type QuotaStatus as ApiQuotaStatus } from "@/lib/quota";

export type Plan = "free" | "pro" | "enterprise";
export type QuotaStatus = {
  plan: Plan;
  used: number;
  limit: number;
  remaining: number;
  upgradeUrl?: string;
};

export function useQuota() {
  const [data, setData] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'unauthenticated' | 'quota_exceeded' | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const quota = await getQuotaStatus();
      
      if (quota.ok) {
        // Success case - convert API format to component format
        setData({
          plan: quota.plan as Plan,
          used: quota.used,
          limit: quota.limit,
          remaining: quota.limit - quota.used,
        });
        setAuthStatus('authenticated');
      } else {
        // Handle different error cases gracefully
        if (quota.code === 401) {
          setAuthStatus('unauthenticated');
          setError('Please sign in to view your quota');
        } else if (quota.code === 402) {
          setAuthStatus('quota_exceeded');
          setData({
            plan: 'free' as Plan, // Default for exceeded case
            used: 0,
            limit: 0,
            remaining: 0,
            upgradeUrl: quota.upgradeUrl,
          });
          setError('Quota exceeded - upgrade to continue');
        } else {
          setError(`Quota error: ${quota.reason}`);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load quota");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const overLimit = useMemo(() => {
    if (!data) return false;
    return data.used >= data.limit;
  }, [data]);

  return { 
    data, 
    loading, 
    error, 
    refresh: fetchStatus, 
    overLimit,
    authStatus,
    needsAuth: authStatus === 'unauthenticated',
    needsUpgrade: authStatus === 'quota_exceeded'
  };
} 