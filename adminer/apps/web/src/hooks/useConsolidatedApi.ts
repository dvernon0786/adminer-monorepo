export const useConsolidatedApi = () => {
  const quotaStatus = async () => {
    try {
      // Mock response for static deployment - API functions removed
      // TODO: Replace with external API service or re-implement serverless functions later
      
      // Simulate network delay for realistic behavior
      await new Promise(resolve => setTimeout(resolve, 120));
      
      // Return mock quota data with realistic values
      const data = {
        plan: 'free',
        limit: 100,
        used: 45,
        month: '2025-09'
      };
      
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