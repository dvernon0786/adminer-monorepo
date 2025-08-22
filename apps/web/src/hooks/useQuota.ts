import { useCallback, useEffect, useMemo, useState } from "react";

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

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/consolidated?action=quota/status", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as QuotaStatus;
      setData(json);
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

  return { data, loading, error, refresh: fetchStatus, overLimit };
} 