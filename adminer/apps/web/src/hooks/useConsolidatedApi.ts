import { useState, useEffect } from 'react';
import { usePersonalWorkspace } from '../components/auth/OrganizationWrapper';
import { useUser } from '@clerk/clerk-react';

export interface ConsolidatedApiData {
  plan: string;
  limit: number;
  used: number;
  month: string;
}

// FIXED: Removed hardcoded mock data - now fetches real data from API
export const useConsolidatedApi = () => {
  const [data, setData] = useState<ConsolidatedApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useUser();
  const { workspace } = usePersonalWorkspace();

  useEffect(() => {
    const fetchRealQuotaData = async () => {
      if (!user || !workspace) return;

      try {
        setLoading(true);
        setError(null);

        console.log('CONSOLIDATED_API: Fetching real quota data from API');

        const response = await fetch('/api/quota', {
          headers: {
            'x-user-id': user.id,
            'x-workspace-id': workspace.id,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const quotaResult = await response.json();
        
        if (quotaResult.success && quotaResult.data) {
          const realData: ConsolidatedApiData = {
            plan: quotaResult.data.plan || 'free',
            limit: quotaResult.data.limit || 100,
            used: quotaResult.data.used || 0, // Real data from database
            month: new Date().toISOString().substring(0, 7) // Current month
          };

          console.log('CONSOLIDATED_API: Real quota data:', realData);
          setData(realData);
        } else {
          throw new Error('Invalid API response');
        }

      } catch (err) {
        console.error('CONSOLIDATED_API: Error fetching quota:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fallback data only on error
        setData({
          plan: 'free',
          limit: 100,
          used: 0, // Default to 0 on error
          month: new Date().toISOString().substring(0, 7)
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRealQuotaData();
  }, [user?.id, workspace?.id]); // Stable dependencies

  const quotaStatus = async () => {
    if (data) {
      // Transform our API response to match the expected frontend format
      return {
        plan: { 
          name: data.plan?.charAt(0).toUpperCase() + data.plan?.slice(1) || 'Free', 
          monthlyAnalyses: data.limit || 100 
        },
        usage: { 
          analyses: data.used || 0 
        },
        resetDate: data.month ? new Date(data.month + '-01').toISOString() : new Date().toISOString()
      };
    }
    
    // Fallback if data not loaded
    return {
      plan: { name: 'Free', monthlyAnalyses: 100 },
      usage: { analyses: 0 },
      resetDate: new Date().toISOString()
    };
  };

  return {
    quotaStatus,
    data,
    loading,
    error
  };
}; 