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
        const token = await getToken();
        const res = await fetch("/api/consolidated?action=quota/status", {
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) {
          // Handle the actual API response structure: {success: true, data: {used, limit}}
          if (json.success && json.data) {
            setData(json.data);
          } else {
            setError("Invalid quota response format");
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to fetch quota");
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