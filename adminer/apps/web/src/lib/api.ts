export async function getQuota() {
  // Mock response for static deployment - API functions removed
  // TODO: Replace with external API service or re-implement serverless functions later
  
  // Simulate network delay for realistic behavior
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return mock quota data
  return {
    success: true,
    data: {
      used: 45,
      limit: 100,
      percentage: 45,
      plan: 'free'
    }
  };
} 