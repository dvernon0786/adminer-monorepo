#!/usr/bin/env node
/**
 * Validate GEMINI_API_KEY
 */

require('dotenv').config({ path: '.env.local' });

async function validateGeminiAPIKey() {
  console.log('🔍 Validating GEMINI_API_KEY...\n');
  
  // Check if key exists
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('\n💡 Make sure to:');
    console.log('   1. Set GEMINI_API_KEY in your .env file');
    console.log('   2. Or export it: export GEMINI_API_KEY=your_key_here');
    process.exit(1);
  }
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Basic validation
  if (apiKey.trim().length === 0) {
    console.error('❌ GEMINI_API_KEY is empty');
    process.exit(1);
  }
  
  console.log(`✅ GEMINI_API_KEY exists (length: ${apiKey.length})`);
  console.log(`   First 10 chars: ${apiKey.substring(0, 10)}...`);
  
  // Test API call
  console.log('\n🧪 Testing API connection...');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Say 'Test successful' and nothing else" }]
          }],
          generationConfig: {
            maxOutputTokens: 50
          }
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ GEMINI_API_KEY is INVALID or EXPIRED');
        console.error('   Response:', JSON.stringify(data, null, 2));
        console.log('\n💡 Please check:');
        console.log('   1. API key is correct (no typos)');
        console.log('   2. API key hasn\'t expired');
        console.log('   3. API key has proper permissions');
        console.log('   4. Get a new key from: https://aistudio.google.com/apikey');
      } else if (response.status === 429) {
        console.error('❌ Rate limit exceeded - API key is valid but too many requests');
      } else {
        console.error(`❌ API Error (${response.status}):`, JSON.stringify(data, null, 2));
      }
      process.exit(1);
    }
    
    if (!data.candidates || !data.candidates[0]) {
      console.error('❌ Invalid response structure:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
    
    const responseText = data.candidates[0].content.parts[0].text;
    console.log('✅ GEMINI_API_KEY is VALID!');
    console.log(`   API Response: "${responseText}"`);
    console.log('\n✅ Validation successful - key is working correctly');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   1. Network connectivity problem');
    console.error('   2. API endpoint is down');
    console.error('   3. Firewall blocking the request');
    process.exit(1);
  }
}

validateGeminiAPIKey();

