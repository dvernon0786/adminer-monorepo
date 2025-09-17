// apps/web/src/hooks/useJobs.ts
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { usePersonalWorkspace } from "../components/auth/OrganizationWrapper";

export function useStartJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { workspace } = usePersonalWorkspace();

  const start = async (keyword: string, input: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    
    // Check if user is authenticated
    if (!user) {
      const errorMsg = "You must be signed in to create jobs";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          "x-user-id": user.id, // Use user ID instead of org ID
          "x-workspace-id": workspace.id // Use personal workspace ID
        },
        credentials: "include",
        body: JSON.stringify({ 
          keyword, 
          userId: user.id,
          workspaceId: workspace.id,
          ...input 
        }),
      });

      if (response.status === 400) {
        const data = await response.json();
        if (data.requiresOrganization) {
          throw new Error("You must be in a valid workspace to create jobs");
        }
        throw new Error(data?.message ?? "Invalid request");
      }

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