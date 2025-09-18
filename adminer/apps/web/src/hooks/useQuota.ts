import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { isProtectedPath } from "@/lib/isProtectedPath";
import { usePersonalWorkspace } from "../components/auth/OrganizationWrapper";

export type Plan = "free" | "pro" | "enterprise";

export type QuotaData = {
  used: number;           // ads scraped (not jobs)
  limit: number;          // from plans table
  percentage: number;     // calculated usage %
  plan: string;          // free, pro, enterprise
  planCode: string;      // free-10, pro-500, ent-2000
  quotaUnit: string;     // 'ads_scraped'
  quotaSource: string;   // 'plans_table'
};

export type QuotaStatus = {
  ok: boolean;
  code?: number;
  reason?: string;
  upgradeUrl?: string;
  data?: QuotaData;
};

export function useQuota() {
  const { isSignedIn, getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { workspace, isLoaded: workspaceLoaded } = usePersonalWorkspace();
  const { pathname } = useLocation();
  const [data, setData] = useState<QuotaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [needsOrg, setNeedsOrg] = useState(false);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  // Memoize stable identifiers to prevent unnecessary re-renders
  const stableUserId = useMemo(() => user?.id, [user?.id]);
  const stableWorkspaceId = useMemo(() => workspace?.id, [workspace?.id]);
  const stablePathname = useMemo(() => pathname, [pathname]);

  // Memoized fetch function to prevent unnecessary re-fetches
  const fetchQuotaData = useCallback(async () => {
    if (!userLoaded || !workspaceLoaded || !stableUserId || !stableWorkspaceId) {
      return;
    }

    // Gate by auth + protected route
    if (!isSignedIn || !isProtectedPath(stablePathname)) {
      setData(null);
      setError(null);
      setLoading(false);
      setNeedsAuth(false);
      setNeedsOrg(false);
      setNeedsUpgrade(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNeedsAuth(false);
      setNeedsOrg(false);
      setNeedsUpgrade(false);

      console.log('USE_QUOTA: Fetching quota data...');
      console.log('USE_QUOTA: User ID:', stableUserId);
      console.log('USE_QUOTA: Workspace ID:', stableWorkspaceId);

      const response = await fetch('/api/quota', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': stableUserId,
          'x-workspace-id': stableWorkspaceId,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setNeedsAuth(true);
          setNeedsOrg(false);
          setNeedsUpgrade(false);
          return;
        }
        
        if (response.status === 400) {
          setNeedsOrg(true);
          setNeedsAuth(false);
          setNeedsUpgrade(false);
          setError('You must be in a valid Clerk organization to use this feature');
          return;
        }
        
        if (response.status === 402) {
          setNeedsAuth(false);
          setNeedsOrg(false);
          setNeedsUpgrade(true);
          setError('Quota exceeded - upgrade required');
          return;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('USE_QUOTA: API response (per-ad quota):', result.data);
        
        const quotaData: QuotaData = {
          used: result.data.used || 0,                    // ads scraped
          limit: result.data.limit || 10,                 // from plans table
          percentage: result.data.percentage || 0,        // calculated %
          plan: result.data.plan || 'free',              // plan type
          planCode: result.data.planCode || 'free-10',   // plan code
          quotaUnit: result.data.quotaUnit || 'ads_scraped',
          quotaSource: result.data.debug?.quotaSource || 'api'
        };
        
        setData(quotaData);
        setNeedsAuth(false);
        setNeedsOrg(false);
        
        // Check if quota exceeded (per ads, not jobs)
        const quotaExceeded = quotaData.used >= quotaData.limit;
        setNeedsUpgrade(quotaExceeded);
        
        if (quotaExceeded) {
          setError(`Quota exceeded: ${quotaData.used}/${quotaData.limit} ads scraped`);
        }
        
        console.log('USE_QUOTA: Quota unit is ads_scraped, not jobs');
        
      } else {
        setError(result.error || 'Failed to fetch quota');
      }
    } catch (e: any) {
      console.error('USE_QUOTA: Error:', e);
      setError(e?.message ?? "Failed to fetch quota");
      setNeedsAuth(false);
      setNeedsOrg(false);
      setNeedsUpgrade(false);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, stablePathname, userLoaded, workspaceLoaded, stableUserId, stableWorkspaceId]);

  // Effect with stable dependencies
  useEffect(() => {
    fetchQuotaData();
  }, [fetchQuotaData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchQuotaData();
  }, [fetchQuotaData]);

  // Helper: Check if user can scrape more ads (not jobs)
  const canScrapeAds = useCallback((requestedAds = 1) => {
    if (!data || needsUpgrade || needsOrg) return false;
    return (data.used + requestedAds) <= data.limit;
  }, [data, needsUpgrade, needsOrg]);

  // Helper: Get remaining ad quota
  const getRemainingAds = useCallback(() => {
    if (!data) return 0;
    return Math.max(0, data.limit - data.used);
  }, [data]);

  return { 
    data, 
    error, 
    loading, 
    needsAuth, 
    needsOrg,
    needsUpgrade,
    canScrapeAds,       // Updated: check ads, not jobs
    getRemainingAds,    // Updated: remaining ads, not generic quota
    refresh,
    orgId: stableWorkspaceId
  };
} 