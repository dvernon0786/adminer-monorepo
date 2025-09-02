// apps/web/src/hooks/useJobs.ts
import { useState } from "react";

export function useStartJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (keyword: string, input: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ keyword, ...input }),
      });

      if (response.status === 402) {
        const data = await response.json();
        throw new Error(data?.message ?? "Quota exceeded. Please upgrade your plan to continue.");
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message ?? `Failed to start job (${response.status})`);
      }

      const result = await response.json();
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { 
    start, 
    loading, 
    error, 
    clearError 
  };
}

export function useJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/jobs", { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs (${response.status})`);
      }
      
      const data = await response.json();
      setJobs(data.jobs || []);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch jobs";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    clearError
  };
} 