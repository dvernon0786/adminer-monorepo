import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { isProtectedPath } from "@/lib/isProtectedPath";
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
  const { pathname } = useLocation();
  const { isSignedIn } = useAuth();
  
  const [data, setData] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'unauthenticated' | 'quota_exceeded' | null>(null);

  const fetchStatus = useCallback(async () => {
    // ⛔️ Skip fetching on public routes or when signed out
    if (!isSignedIn || !isProtectedPath(pathname)) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

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
          // Signed out: don't block UI globally
          setData(null);
          setLoading(false);
          return;
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
  }, [isSignedIn, pathname]);

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
    needsAuth: !isSignedIn && isProtectedPath(pathname),
    needsUpgrade: !!data && data.remaining <= 0
  };
} 