export const useConsolidatedApi = () => {
  const quotaStatus = async () => {
    try {
      const response = await fetch('/api/consolidated?action=quota/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 402) {
          // Quota exceeded - return upgrade information
          const errorData = await response.json();
          throw new Error(`Quota exceeded. Upgrade to continue.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform our API response to match the expected frontend format
      return {
        plan: { 
          name: data.plan?.charAt(0).toUpperCase() + data.plan?.slice(1) || 'Free', 
          monthlyAnalyses: data.limit || 10 
        },
        usage: { 
          analyses: data.used || 0 
        },
        resetDate: data.month ? new Date(data.month + '-01').toISOString() : new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to fetch quota status:', error);
      throw error;
    }
  };

  return {
    quotaStatus
  };
}; 