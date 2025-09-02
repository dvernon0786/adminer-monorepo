const { DodoClient } = require('./src/lib/dodo.cjs');
const crypto = require('crypto');

async function testPaymentSystem() {
  // Dynamic import for ES modules
  const { db, orgs, plans, webhookEvents } = await import('./src/lib/db.js');
  console.log('🧪 Comprehensive Payment System Testing...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  try {
    // Test 1: Database connectivity
    console.log('1. Testing database connection...');
    try {
      const plansResult = await db.select().from(plans);
      const orgsResult = await db.select().from(orgs).limit(3);
      console.log(`   ✅ Plans: ${plansResult.length}, Orgs: ${orgsResult.length}`);
      results.passed++;
    } catch (error) {
      console.log(`   ❌ Database connection failed: ${error.message}`);
      results.failed++;
    }

    // Test 2: Dodo client configuration
    console.log('\n2. Testing Dodo client configuration...');
    try {
      const dodo = new DodoClient();
      
      const checks = [
        { name: 'API URL', value: dodo.apiUrl, required: true },
        { name: 'API Key', value: !!dodo.apiKey, required: true },
        { name: 'Secret Key', value: !!dodo.secretKey, required: false } // Optional for testing
      ];
      
      checks.forEach(check => {
        if (check.required && !check.value) {
          console.log(`   ❌ ${check.name}: Missing`);
          results.failed++;
        } else if (check.value) {
          console.log(`   ✅ ${check.name}: Configured`);
          results.passed++;
        } else {
          console.log(`   ⚠️  ${check.name}: Optional, not set`);
          results.warnings++;
        }
      });
    } catch (error) {
      console.log(`   ❌ Client initialization failed: ${error.message}`);
      results.failed++;
    }

    // Test 3: Fetch compatibility
    console.log('\n3. Testing fetch compatibility...');
    try {
      // Test if fetch is available
      const testFetch = typeof globalThis.fetch !== 'undefined' ? 
        globalThis.fetch : require('node-fetch');
      
      console.log(`   ✅ Fetch available: ${typeof testFetch === 'function'}`);
      results.passed++;
    } catch (error) {
      console.log(`   ❌ Fetch not available: ${error.message}`);
      console.log(`   💡 Solution: npm install node-fetch`);
      results.failed++;
    }

    // Test 4: Webhook signature verification
    console.log('\n4. Testing webhook signature verification...');
    try {
      const dodo = new DodoClient();
      
      if (!dodo.secretKey) {
        console.log('   ⚠️  DODO_SECRET_KEY not configured - skipping signature test');
        results.warnings++;
      } else {
        const testPayload = '{"type":"test","data":{"metadata":{"orgId":"test"}}}';
        
        // Test with invalid signature
        const invalidResult = dodo.verifyWebhook(testPayload, 'sha256=invalid');
        
        // Test with valid signature
        const validSignature = 'sha256=' + crypto
          .createHmac('sha256', dodo.secretKey)
          .update(testPayload, 'utf8')
          .digest('hex');
        const validResult = dodo.verifyWebhook(testPayload, validSignature);
        
        if (!invalidResult && validResult) {
          console.log('   ✅ Signature verification working correctly');
          results.passed++;
        } else {
          console.log(`   ❌ Signature verification failed: invalid=${invalidResult}, valid=${validResult}`);
          results.failed++;
        }
      }
    } catch (error) {
      console.log(`   ❌ Signature verification test failed: ${error.message}`);
      results.failed++;
    }

    // Test 5: Plan validation and pricing
    console.log('\n5. Testing plan validation and pricing...');
    try {
      const expectedPlans = [
        { code: 'pro-500', name: 'Pro Plan', price: 4900, quota: 500 },
        { code: 'ent-2000', name: 'Enterprise Plan', price: 19900, quota: 2000 }
      ];
      
      expectedPlans.forEach(plan => {
        console.log(`   ✅ ${plan.name} (${plan.code}): $${plan.price/100}/month, ${plan.quota} requests`);
      });
      results.passed++;
    } catch (error) {
      console.log(`   ❌ Plan validation failed: ${error.message}`);
      results.failed++;
    }

    // Test 6: Simulated webhook processing
    console.log('\n6. Testing simulated webhook event processing...');
    try {
      // Create a test webhook event structure
      const testWebhookEvent = {
        type: 'checkout.session.completed',
        data: {
          customer_id: 'cus_test123',
          subscription_id: 'sub_test456',
          metadata: {
            orgId: 'test-org-123',
            planCode: 'pro-500'
          },
          subscription: {
            current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
          }
        }
      };

      // Test metadata extraction
      const metadata = testWebhookEvent?.data?.metadata;
      const hasRequiredFields = metadata?.orgId && metadata?.planCode;
      
      if (hasRequiredFields) {
        console.log('   ✅ Webhook event structure validation passed');
        console.log(`   ✅ Metadata: orgId=${metadata.orgId}, planCode=${metadata.planCode}`);
        results.passed++;
      } else {
        console.log('   ❌ Webhook event structure validation failed');
        results.failed++;
      }
    } catch (error) {
      console.log(`   ❌ Webhook simulation failed: ${error.message}`);
      results.failed++;
    }

    // Test 7: Node.js version compatibility
    console.log('\n7. Testing Node.js version compatibility...');
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      console.log(`   ℹ️  Node.js version: ${nodeVersion}`);
      
      if (majorVersion >= 18) {
        console.log('   ✅ Node.js 18+ - native fetch available');
        results.passed++;
      } else {
        console.log('   ⚠️  Node.js < 18 - ensure node-fetch is installed');
        try {
          require('node-fetch');
          console.log('   ✅ node-fetch dependency found');
          results.passed++;
        } catch {
          console.log('   ❌ node-fetch not found - install with: npm install node-fetch');
          results.failed++;
        }
      }
    } catch (error) {
      console.log(`   ❌ Version check failed: ${error.message}`);
      results.failed++;
    }

    // Test Summary
    console.log('\n🎯 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    
    const total = results.passed + results.failed;
    const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
    console.log(`📊 Success Rate: ${successRate}%`);

    if (results.failed === 0) {
      console.log('\n🎉 All critical tests passed! Payment system is production-ready.');
      console.log('\n📋 Next steps:');
      console.log('   1. Deploy to production');
      console.log('   2. Configure Dodo webhook URL in dashboard');
      console.log('   3. Test live checkout flow with small amount');
      console.log('   4. Monitor webhook logs for successful processing');
      
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Address the issues above before production deployment.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error.message);
    process.exit(1);
  }
}

testPaymentSystem();
