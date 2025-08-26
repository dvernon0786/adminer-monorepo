import { useAuth } from "@clerk/nextjs";

export function useApi() {
  const { getToken } = useAuth();

  async function fetchQuotaStatus() {
    try {
      // Get JWT using your AdminerAPI template
      const token = await getToken({ template: "AdminerAPI" });
      
      if (!token) {
        throw new Error("No authentication token available");
      }

      const res = await fetch("/api/consolidated?action=quota/status", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        if (res.status === 402) {
          // Quota exceeded - return upgrade info
          const data = await res.json();
          return { ...data, status: 402 };
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error("Error fetching quota status:", error);
      throw error;
    }
  }

  async function createJob(keyword: string, limit: number) {
    try {
      // Get JWT using your AdminerAPI template
      const token = await getToken({ template: "AdminerAPI" });
      
      if (!token) {
        throw new Error("No authentication token available");
      }

      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ keyword, limit })
      });

      if (!res.ok) {
        if (res.status === 402) {
          // Quota exceeded - return upgrade info
          const data = await res.json();
          return { ...data, status: 402 };
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  }

  async function getJobStatus(jobId: string) {
    try {
      // Get JWT using your AdminerAPI template
      const token = await getToken({ template: "AdminerAPI" });
      
      if (!token) {
        throw new Error("No authentication token available");
      }

      const res = await fetch(`/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error("Error fetching job status:", error);
      throw error;
    }
  }

  return { 
    fetchQuotaStatus, 
    createJob, 
    getJobStatus 
  };
} 