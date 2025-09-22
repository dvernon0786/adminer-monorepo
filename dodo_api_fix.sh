#!/bin/bash

set -e

echo "🔍 DEBUG DODO API EMPTY RESPONSE ISSUE"
echo "======================================"
echo "Issue: Dodo API configured but returning empty responses"
echo "Evidence: 'Empty response from Dodo Payments API' in console logs"
echo "Environment: Dodo variables are configured"
echo ""

echo "✅ Starting Dodo API fix implementation"

echo ""
echo "📊 PHASE 1: BACKUP CURRENT IMPLEMENTATION"
echo "========================================="

# Backup current DodoClient
if [ -f "adminer/apps/api/src/lib/dodo.js" ]; then
    cp adminer/apps/api/src/lib/dodo.js adminer/apps/api/src/lib/dodo.js.backup
    echo "✅ Backed up current DodoClient"
else
    echo "❌ DodoClient not found at expected location"
fi

echo ""
echo "📊 PHASE 2: IMPLEMENT FIXED DODO CLIENT"
echo "======================================"

echo "🔧 Creating enhanced DodoClient with comprehensive error handling..."

# Create the fixed DodoClient implementation
cat > adminer/apps/api/src/lib/dodo.js << 'EOF'
const crypto = require('crypto');

class DodoClient {
  constructor() {
    this.apiKey = process.env.DODO_PAYMENTS_API_KEY;
    this.secretKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    this.environment = process.env.DODO_PAYMENTS_ENVIRONMENT || 'test';
    
    console.log('🔧 DODO_CLIENT_INIT', {
      hasApiKey: !!this.apiKey,
      hasSecretKey: !!this.secretKey,
      environment: this.environment,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 20) + '...' : 'none'
    });
  }

  async createCheckoutSession(checkoutData) {
    console.log('🚀 DODO_CREATE_CHECKOUT_SESSION', {
      timestamp: new Date().toISOString(),
      checkoutData: JSON.stringify(checkoutData, null, 2),
      hasApiKey: !!this.apiKey,
      environment: this.environment
    });

    try {
      // Handle free plan immediately
      if (checkoutData.product_cart && 
          checkoutData.product_cart[0] && 
          checkoutData.product_cart[0].product_id === 'prod_free_plan') {
        console.log('✅ DODO_FREE_PLAN_ACTIVATION');
        return {
          success: true,
          checkout_url: null,
          session_id: `free_${Date.now()}`,
          plan: { name: 'Free Plan', price: 0 },
          immediate_activation: true,
          redirect_url: checkoutData.return_url || 'https://adminer.online/dashboard?plan=free'
        };
      }

      // If no API key, return mock response
      if (!this.apiKey || !this.secretKey || this.apiKey === 'test_mode_key') {
        console.log('⚠️ DODO_MOCK_MODE: No valid API keys configured');
        const mockSessionId = `mock_${Date.now()}`;
        const planName = checkoutData.product_cart[0].product_id === 'prod_pro_plan' ? 'Pro Plan' : 'Enterprise Plan';
        const price = checkoutData.product_cart[0].product_id === 'prod_pro_plan' ? 9900 : 19900;
        
        return {
          success: true,
          checkout_url: `https://checkout.dodopayments.com/session/${mockSessionId}`,
          session_id: mockSessionId,
          plan: { name: planName, price: price },
          mock_mode: true,
          message: 'Using mock checkout URL - configure DODO_PAYMENTS_API_KEY for real payments'
        };
      }

      // Use the correct Dodo Payments API URL
      const apiUrl = this.environment === 'live' 
        ? 'https://api.dodopayments.com' 
        : 'https://api.dodopayments.com'; // Dodo uses same URL for test/live, differentiated by API keys

      const requestUrl = `${apiUrl}/checkout-sessions`;
      
      console.log('📡 DODO_API_REQUEST', {
        url: requestUrl,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey.substring(0, 20)}...`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutData, null, 2)
      });

      // Make the API call to Dodo Payments
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Adminer/1.0'
        },
        body: JSON.stringify(checkoutData),
      });

      console.log('📨 DODO_API_RESPONSE_STATUS', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          'content-type': response.headers.get('content-type'),
          'content-length': response.headers.get('content-length')
        }
      });

      // Get response text first to avoid JSON parsing issues
      const responseText = await response.text();
      
      console.log('📄 DODO_API_RESPONSE_TEXT', {
        length: responseText.length,
        isEmpty: responseText.length === 0,
        content: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
      });

      // Handle empty response
      if (!responseText || responseText.length === 0) {
        console.log('❌ DODO_EMPTY_RESPONSE: API returned empty response');
        throw new Error('Empty response from Dodo Payments API');
      }

      // Parse JSON response
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('✅ DODO_API_RESPONSE_PARSED', {
          hasCheckoutUrl: !!result.checkout_url,
          hasSessionId: !!result.session_id || !!result.id,
          keys: Object.keys(result)
        });
      } catch (parseError) {
        console.log('❌ DODO_JSON_PARSE_ERROR', {
          error: parseError.message,
          responseText: responseText.substring(0, 200)
        });
        throw new Error(`Failed to parse Dodo API response: ${parseError.message}`);
      }

      // Handle API errors
      if (!response.ok) {
        console.log('❌ DODO_API_ERROR', {
          status: response.status,
          error: result.error || result.message || 'Unknown error',
          details: result
        });
        throw new Error(`Dodo API error (${response.status}): ${result.error || result.message || 'Unknown error'}`);
      }

      // Validate required fields in response
      const sessionId = result.session_id || result.id;
      const checkoutUrl = result.checkout_url || result.url;

      if (!sessionId) {
        console.log('❌ DODO_MISSING_SESSION_ID', result);
        throw new Error('Dodo API response missing session ID');
      }

      if (!checkoutUrl) {
        console.log('❌ DODO_MISSING_CHECKOUT_URL', result);
        throw new Error('Dodo API response missing checkout URL');
      }

      // Return successful response
      const successResponse = {
        success: true,
        checkout_url: checkoutUrl,
        session_id: sessionId,
        plan: result.plan || { 
          name: checkoutData.product_cart[0].product_id === 'prod_pro_plan' ? 'Pro Plan' : 'Enterprise Plan',
          price: checkoutData.product_cart[0].product_id === 'prod_pro_plan' ? 9900 : 19900
        },
        customer: result.customer,
        expires_at: result.expires_at,
        metadata: result.metadata
      };

      console.log('🎉 DODO_CHECKOUT_SUCCESS', {
        sessionId: sessionId,
        checkoutUrl: checkoutUrl,
        hasCustomer: !!result.customer
      });

      return successResponse;

    } catch (error) {
      console.error('💥 DODO_CHECKOUT_ERROR', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Return error response instead of throwing
      return {
        success: false,
        error: error.message,
        checkout_url: null,
        session_id: null,
        fallback_required: true
      };
    }
  }

  verifyWebhook(payload, signature) {
    try {
      if (!this.secretKey) {
        console.log('⚠️ DODO_WEBHOOK_NO_SECRET_KEY');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload, 'utf8')
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );

      console.log('🔐 DODO_WEBHOOK_VERIFICATION', {
        isValid: isValid,
        hasSignature: !!signature,
        signaturePrefix: signature ? signature.substring(0, 20) + '...' : 'none'
      });

      return isValid;
    } catch (error) {
      console.error('💥 DODO_WEBHOOK_VERIFICATION_ERROR', error);
      return false;
    }
  }
}

module.exports = new DodoClient();
