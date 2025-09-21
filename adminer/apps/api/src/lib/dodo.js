const crypto = require('crypto');

class DodoClient {
  constructor() {
    this.apiKey = process.env.DODO_PAYMENTS_API_KEY;
    this.secretKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    this.environment = process.env.DODO_PAYMENTS_ENVIRONMENT || 'test';
    // Use correct Dodo Payments API URLs as per documentation
    this.apiUrl = this.environment === 'live' 
      ? 'https://live.dodopayments.com' 
      : 'https://test.dodopayments.com';
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adminer.online';
    
    console.log('DODO_CLIENT_INIT:', {
      environment: this.environment,
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey,
      hasSecretKey: !!this.secretKey,
      appUrl: this.appUrl
    });
  }

  async createCheckoutSession(checkoutData) {
    try {
      console.log('DODO_CHECKOUT_SESSION_REQUEST:', {
        checkoutData,
        timestamp: new Date().toISOString()
      });

      // For free plan, create immediate subscription
      if (checkoutData.product_cart[0].product_id === 'prod_free_plan') {
        return {
          success: true,
          checkout_url: null,
          session_id: `free_${Date.now()}`,
          plan: { name: 'Free Plan', price: 0 },
          immediate_activation: true
        };
      }

      // If no API keys configured, return mock response for development
      if (!this.apiKey || !this.secretKey) {
        console.log('DODO_MOCK_MODE: Returning mock checkout session');
        return {
          success: true,
          checkout_url: `https://app.dodopayments.com/checkout/mock_${Date.now()}`,
          session_id: `mock_${Date.now()}`,
          plan: { 
            name: checkoutData.product_cart[0].product_id === 'prod_pro_plan' ? 'Pro Plan' : 'Enterprise Plan', 
            price: checkoutData.product_cart[0].product_id === 'prod_pro_plan' ? 4900 : 19900 
          },
          mock_mode: true
        };
      }

      // Make actual API call to Dodo Payments
      console.log('DODO_API_REQUEST:', {
        url: `${this.apiUrl}/checkout-sessions`,
        method: 'POST',
        hasApiKey: !!this.apiKey,
        checkoutData
      });

      const response = await fetch(`${this.apiUrl}/checkout-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      console.log('DODO_API_RESPONSE:', {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Check if response has content before trying to parse JSON
      const responseText = await response.text();
      console.log('DODO_API_RESPONSE_TEXT:', responseText);

      if (!responseText) {
        throw new Error('Empty response from Dodo Payments API');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('DODO_API_JSON_PARSE_ERROR:', parseError);
        throw new Error(`Invalid JSON response from Dodo API: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(`Dodo API error: ${result.message || response.statusText}`);
      }

      console.log('DODO_CHECKOUT_SUCCESS:', {
        sessionId: result.session_id,
        checkoutUrl: result.checkout_url
      });

      return {
        success: true,
        checkout_url: result.checkout_url,
        session_id: result.session_id,
        plan: result.plan || { name: 'Plan', price: 0 }
      };

    } catch (error) {
      console.error('DODO_CHECKOUT_ERROR:', error);
      throw error;
    }
  }

  verifyWebhook(payload, signature) {
    try {
      if (!this.secretKey) {
        console.warn('DODO_SECRET_KEY not configured - webhook verification skipped');
        return true; // Allow in development
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload, 'utf8')
        .digest('hex');
      
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(`sha256=${expectedSignature}`, 'utf8')
      );

      console.log('DODO_WEBHOOK_VERIFICATION:', {
        isValid,
        signature: signature ? 'present' : 'missing',
        timestamp: new Date().toISOString()
      });

      return isValid;

    } catch (error) {
      console.error('DODO_WEBHOOK_VERIFICATION_ERROR:', error);
      return false;
    }
  }

  async createCustomer(orgId, userEmail = null, orgName = null) {
    try {
      const payload = {
        external_id: orgId,
        email: userEmail,
        name: orgName,
        metadata: {
          source: 'adminer',
          created_at: new Date().toISOString(),
          orgId
        }
      };

      console.log('DODO_CREATE_CUSTOMER:', payload);

      if (!this.apiKey) {
        console.log('DODO_MOCK_MODE: Returning mock customer');
        return {
          id: `cust_mock_${Date.now()}`,
          external_id: orgId,
          email: userEmail,
          mock_mode: true
        };
      }

      const response = await fetch(`${this.apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Dodo customer creation error: ${result.message || response.statusText}`);
      }

      console.log('DODO_CUSTOMER_CREATED:', result.id);
      return result;

    } catch (error) {
      console.error('DODO_CREATE_CUSTOMER_ERROR:', error);
      throw error;
    }
  }
}

module.exports = { DodoClient };