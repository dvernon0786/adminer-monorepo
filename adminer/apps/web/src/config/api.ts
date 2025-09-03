// API Configuration
const isDevelopment = import.meta.env.MODE === 'development';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000'
  : 'https://adminer-api.vercel.app';

// API endpoints
export const API_ENDPOINTS = {
  jobs: `${API_BASE_URL}/api/jobs`,
  consolidated: `${API_BASE_URL}/api/consolidated`,
  health: `${API_BASE_URL}/api/health`,
  checkout: `${API_BASE_URL}/api/checkout`,
  webhook: `${API_BASE_URL}/api/webhook`,
  inngest: `${API_BASE_URL}/api/inngest`
};
