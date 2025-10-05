import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { isProtectedPath } from "@/lib/isProtectedPath";
import { usePersonalWorkspace } from "../components/auth/OrganizationWrapper";
import { AnalysisResult } from "@/types/dashboard";

export function useAnalyses() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { workspace } = usePersonalWorkspace();
  const { pathname } = useLocation();
  const [data, setData] = useState<AnalysisResult[] | null>(null);
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Gate by auth + protected route + user
    if (!isSignedIn || !isProtectedPath(pathname) || !user) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        
        // Call real API endpoint with organization ID
        const response = await fetch(`/api/dashboard-analytics?organizationId=${workspace.id}`, {
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
          setData(result.data.analyses || []);
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('Failed to fetch analyses:', e);
          setError(e?.message ?? "Failed to fetch analyses");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = false;
    };
  }, [isSignedIn, pathname, user?.id, workspace?.id]);

  return { data, error, loading };
}