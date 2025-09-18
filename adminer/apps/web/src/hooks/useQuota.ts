import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { isProtectedPath } from "@/lib/isProtectedPath";
import { usePersonalWorkspace } from "../components/auth/OrganizationWrapper";

export type Plan = "free" | "pro" | "enterprise";
export type QuotaData = {
  used: number;
  limit: number;
  percentage: number;
  plan: string;
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
        console.log('USE_QUOTA: API response:', result.data);
        setData({
          used: result.data.used || 0,
          limit: result.data.limit || 100,
          percentage: result.data.percentage || 0,
          plan: result.data.plan || 'free'
        });
        setNeedsAuth(false);
        setNeedsOrg(false);
        
        // CHECK IF USER NEEDS UPGRADE
        const quotaExceeded = result.data.used >= result.data.limit;
        setNeedsUpgrade(quotaExceeded);
        
        if (quotaExceeded) {
          setError(`Quota exceeded: ${result.data.used}/${result.data.limit} ads used`);
        }
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

  // Helper function to check if user can create jobs
  const canCreateJob = useCallback((requestedAds = 1) => {
    if (!data || needsUpgrade || needsOrg) return false;
    return (data.used + requestedAds) <= data.limit;
  }, [data, needsUpgrade, needsOrg]);

  // Helper function to get remaining quota
  const getRemainingQuota = useCallback(() => {
    if (!data) return 0;
    return Math.max(0, data.limit - data.used);
  }, [data]);

  return { 
    data, 
    error, 
    loading, 
    needsAuth, 
    needsOrg,          // NEW: Indicates user needs to be in organization
    needsUpgrade,      // NEW: Indicates paywall should be shown
    canCreateJob,      // NEW: Helper to check if job creation allowed
    getRemainingQuota, // NEW: Helper to get remaining ads
    refresh,           // NEW: Manual refresh function
    orgId: stableWorkspaceId // NEW: Provide the stable workspace ID
  };
} 