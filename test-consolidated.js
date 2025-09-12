// Test the consolidated.js file
const consolidated = require('./adminer/apps/api/api/consolidated.js');

// Mock request and response
const mockReq = {
  method: 'POST',
  url: 'https://adminer-api-fixed.vercel.app/api/consolidated',
  headers: {
    'content-type': 'application/json',
    'host': 'adminer-api-fixed.vercel.app'
  },
  body: { keyword: 'test', limit: 5 }
};

const mockRes = {
  setHeader: (key, value) => console.log(`Set header: ${key} = ${value}`),
  status: (code) => {
    console.log(`Status: ${code}`);
    return {
      json: (data) => console.log('Response:', JSON.stringify(data, null, 2))
    };
  },
  end: () => console.log('Response ended')
};

// Test the handler
console.log('Testing consolidated handler...');
try {
  consolidated(mockReq, mockRes);
} catch (error) {
  console.error('Error:', error);
}