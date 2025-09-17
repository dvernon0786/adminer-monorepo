import { useEffect, useState } from "react";
import { useAuth, useOrganization } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { isProtectedPath } from "@/lib/isProtectedPath";

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
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { pathname } = useLocation();
  const [data, setData] = useState<QuotaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [needsOrg, setNeedsOrg] = useState(false);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  useEffect(() => {
    // Gate by auth + protected route
    if (!isSignedIn || !isProtectedPath(pathname)) {
      setData(null);
      setError(null);
      setLoading(false);
      setNeedsAuth(false);
      setNeedsOrg(false);
      setNeedsUpgrade(false);
      return;
    }

    // Wait for Clerk to load organization data
    if (!orgLoaded) {
      return;
    }

    // Check if user is in an organization
    if (!organization) {
      setNeedsOrg(true);
      setNeedsAuth(false);
      setNeedsUpgrade(false);
      setError('You must be in an organization to use this feature');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setNeedsAuth(false);
        setNeedsOrg(false);
        setNeedsUpgrade(false);
        
        // Call real API endpoint with organization ID
        const response = await fetch('/api/quota', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-org-id': organization.id, // Use real Clerk org ID
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
            // ORGANIZATION REQUIRED - User must be in valid Clerk org
            setNeedsOrg(true);
            setNeedsAuth(false);
            setNeedsUpgrade(false);
            setError('You must be in a valid Clerk organization to use this feature');
            return;
          }
          
          if (response.status === 402) {
            // QUOTA EXCEEDED - TRIGGER PAYWALL
            setNeedsAuth(false);
            setNeedsOrg(false);
            setNeedsUpgrade(true);
            setError('Quota exceeded - upgrade required');
            return;
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!cancelled && result.success && result.data) {
          setData({
            used: result.data.used || 0,
            limit: result.data.limit || 10,
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
        if (!cancelled) {
          console.error('Failed to fetch quota:', e);
          setError(e?.message ?? "Failed to fetch quota");
          setNeedsAuth(false);
          setNeedsOrg(false);
          setNeedsUpgrade(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = false;
    };
  }, [isSignedIn, pathname, organization, orgLoaded, getToken]);

  // Helper function to check if user can create jobs
  const canCreateJob = (requestedAds = 1) => {
    if (!data || needsUpgrade || needsOrg) return false;
    return (data.used + requestedAds) <= data.limit;
  };

  // Helper function to get remaining quota
  const getRemainingQuota = () => {
    if (!data) return 0;
    return Math.max(0, data.limit - data.used);
  };

  return { 
    data, 
    error, 
    loading, 
    needsAuth, 
    needsOrg,          // NEW: Indicates user needs to be in organization
    needsUpgrade,      // NEW: Indicates paywall should be shown
    canCreateJob,      // NEW: Helper to check if job creation allowed
    getRemainingQuota, // NEW: Helper to get remaining ads
    orgId: organization?.id // NEW: Provide the real org ID
  };
} 