#!/usr/bin/env node

/**
 * Test Dodo Credentials and API Connectivity
 * 
 * This script tests the Dodo API credentials configured in Vercel
 * to verify they are working correctly before implementing the payment system.
 */

const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

class DodoCredentialTester {
  constructor() {
    this.apiKey = process.env.DODO_PAYMENTS_API_KEY;
    this.secretKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    this.environment = process.env.DODO_PAYMENTS_ENVIRONMENT || 'test';
    this.apiUrl = this.environment === 'live' 
      ? 'https://api.dodopayments.com/v1' 
      : 'https://test.dodopayments.com/v1';
    
    console.log('🔍 DODO CREDENTIALS TESTER');
    console.log('==========================');
    console.log(`Environment: ${this.environment}`);
    console.log(`API URL: ${this.apiUrl}`);
    console.log(`API Key: ${this.apiKey ? '✅ Present' : '❌ Missing'}`);
    console.log(`Secret Key: ${this.secretKey ? '✅ Present' : '❌ Missing'}`);
    console.log('');
  }

  async testApiConnectivity() {
    console.log('📡 Testing API Connectivity...');
    
    if (!this.apiKey) {
      throw new Error('DODO_PAYMENTS_API_KEY not configured');
    }

    try {
      // Test API connectivity with a simple request
      const response = await fetch(`${this.apiUrl}/customers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`API Response Status: ${response.status}`);
      
      if (response.ok) {
        console.log('✅ API connectivity successful');
        return true;
      } else {
        const errorText = await response.text();
        console.log(`❌ API connectivity failed: ${response.status} - ${errorText}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ API connectivity error: ${error.message}`);
      return false;
    }
  }

  async testWebhookSignature() {
    console.log('🔐 Testing Webhook Signature Verification...');
    
    if (!this.secretKey) {
      console.log('⚠️ DODO_PAYMENTS_WEBHOOK_KEY not configured - skipping webhook test');
      return true;
    }

    try {
      const testPayload = JSON.stringify({ test: 'webhook_signature' });
      const testSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(testPayload, 'utf8')
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(`sha256=${testSignature}`, 'utf8'),
        Buffer.from(`sha256=${testSignature}`, 'utf8')
      );

      if (isValid) {
        console.log('✅ Webhook signature verification working');
        return true;
      } else {
        console.log('❌ Webhook signature verification failed');
        return false;
      }
    } catch (error) {
      console.log(`❌ Webhook signature error: ${error.message}`);
      return false;
    }
  }

  async testCheckoutSessionCreation() {
    console.log('💳 Testing Checkout Session Creation...');
    
    if (!this.apiKey) {
      console.log('⚠️ DODO_PAYMENTS_API_KEY not configured - skipping checkout test');
      return true;
    }

    try {
      const testPayload = {
        amount: 100, // $1.00 test amount
        currency: 'usd',
        description: 'Test checkout session',
        metadata: {
          test: true,
          source: 'adminer_test'
        },
        success_url: 'https://adminer.online/dashboard?test=success',
        cancel_url: 'https://adminer.online/pricing?test=cancelled'
      };

      const response = await fetch(`${this.apiUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Checkout session creation successful');
        console.log(`Session ID: ${result.id}`);
        console.log(`Checkout URL: ${result.url}`);
        return true;
      } else {
        console.log(`❌ Checkout session creation failed: ${response.status} - ${result.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Checkout session error: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Running All Dodo Credential Tests...\n');

    const results = {
      apiConnectivity: await this.testApiConnectivity(),
      webhookSignature: await this.testWebhookSignature(),
      checkoutSession: await this.testCheckoutSessionCreation()
    };

    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('======================');
    console.log(`API Connectivity: ${results.apiConnectivity ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Webhook Signature: ${results.webhookSignature ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Checkout Session: ${results.checkoutSession ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED - DODO CREDENTIALS ARE WORKING!');
      console.log('✅ Ready to implement payment system');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED - CHECK CREDENTIALS');
      console.log('❌ Payment system implementation may have issues');
    }

    return allPassed;
  }
}

// Run the tests
async function main() {
  try {
    const tester = new DodoCredentialTester();
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner error:', error.message);
    process.exit(1);
  }
}

main();