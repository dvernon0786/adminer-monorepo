#!/usr/bin/env node

/**
 * Query Production Job Data Script
 * Uses production API to retrieve job data
 */

const https = require('https');

async function queryProductionJob() {
  console.log('🔍 Querying production job data for job-1757891392156-ckupkz7sd...\n');

  try {
    // First, let's check if we can query jobs by ID through the API
    const jobId = 'job-1757891392156-ckupkz7sd';
    
    console.log('📊 Attempting to query job data...');
    
    // Try to get job data through API (if endpoint exists)
    const apiUrl = 'https://www.adminer.online/api/jobs/' + jobId;
    
    const response = await new Promise((resolve, reject) => {
      const req = https.get(apiUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ error: 'Invalid JSON response', raw: data });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
    console.log('📋 API Response:');
    console.log(JSON.stringify(response, null, 2));
    
    // If no specific job endpoint, let's check what endpoints are available
    console.log('\n🔍 Checking available API endpoints...');
    
    const healthResponse = await new Promise((resolve, reject) => {
      const req = https.get('https://www.adminer.online/api/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ error: 'Invalid JSON response', raw: data });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
    console.log('📊 Health Check Response:');
    console.log(JSON.stringify(healthResponse, null, 2));
    
    // Check if we can create a new job to test the pipeline
    console.log('\n🧪 Testing job creation pipeline...');
    
    const testJobData = {
      keyword: 'test-query',
      limit: 1
    };
    
    const createResponse = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(testJobData);
      
      const options = {
        hostname: 'www.adminer.online',
        port: 443,
        path: '/api/jobs',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-org-id': 'default-org'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ error: 'Invalid JSON response', raw: data });
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    console.log('📋 Job Creation Test Response:');
    console.log(JSON.stringify(createResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the query
queryProductionJob().then(() => {
  console.log('\n✅ Query completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});