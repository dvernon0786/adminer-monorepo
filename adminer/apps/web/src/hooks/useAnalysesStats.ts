import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { isProtectedPath } from "@/lib/isProtectedPath";

export type AnalysisStats = {
  total: number;
  images: number;
  videos: number;
  text: number;
  errors: number;
};

export function useAnalysesStats() {
  const { isSignedIn, getToken } = useAuth();
  const { pathname } = useLocation();
  const [data, setData] = useState<AnalysisStats | null>(null);
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
        const response = await fetch('/api/analyses/stats', {
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
            total: result.data.total || 0,
            images: result.data.images || 0,
            videos: result.data.videos || 0,
            text: result.data.text || 0,
            errors: result.data.errors || 0
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('Failed to fetch analysis statistics:', e);
          setError(e?.message ?? "Failed to fetch analysis statistics");
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