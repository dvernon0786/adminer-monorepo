import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { isProtectedPath } from "@/lib/isProtectedPath";

export type Plan = "free" | "pro" | "enterprise";
export type QuotaStatus = {
  plan: Plan;
  used: number;
  limit: number;
  remaining: number;
  upgradeUrl?: string;
};

export function useQuota() {
  const { isSignedIn, getToken } = useAuth();
  const { pathname } = useLocation();
  const [data, setData] = useState<null | { used: number; limit: number; percentage: number }>(null);
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Gate by auth + protected route
    if (!isSignedIn || !isProtectedPath(pathname)) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        
        // Call real API endpoint
        const response = await fetch('/api/quota', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!cancelled && result.success && result.data) {
          setData({
            used: result.data.used || 0,
            limit: result.data.limit || 100,
            percentage: result.data.percentage || 0
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('Failed to fetch quota:', e);
          setError(e?.message ?? "Failed to fetch quota");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = false;
    };
  }, [isSignedIn, pathname, getToken]);

  return { data, error, loading };
} 