const crypto = require('crypto');

class DodoClient {
  constructor() {
    this.apiKey = process.env.DODO_PAYMENTS_API_KEY;
    this.secretKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    this.environment = process.env.DODO_PAYMENTS_ENVIRONMENT || 'test';
    this.apiUrl = this.environment === 'live' 
      ? 'https://api.dodopayments.com/v1' 
      : 'https://test.dodopayments.com/v1';
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adminer.online';
    
    console.log('DODO_CLIENT_INIT:', {
      environment: this.environment,
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey,
      hasSecretKey: !!this.secretKey,
      appUrl: this.appUrl
    });
  }

  async createCheckoutSession(planCode, orgId, orgName = null, userEmail = null) {
    try {
      console.log('DODO_CHECKOUT_SESSION_REQUEST:', {
        planCode,
        orgId,
        orgName,
        userEmail,
        timestamp: new Date().toISOString()
      });

      // Plan configuration
      const planMap = {
        'free-10': { price: 0, name: 'Free Plan', quota: 10 },
        'pro-500': { price: 4900, name: 'Pro Plan', quota: 500 },
        'ent-2000': { price: 19900, name: 'Enterprise Plan', quota: 2000 }
      };

      const plan = planMap[planCode];
      if (!plan) {
        throw new Error(`Invalid plan code: ${planCode}`);
      }

      // For free plan, create immediate subscription
      if (planCode === 'free-10') {
        return {
          success: true,
          checkout_url: null,
          session_id: `free_${Date.now()}`,
          plan: plan,
          immediate_activation: true
        };
      }

      // Create checkout session payload
      const payload = {
        amount: plan.price,
        currency: 'usd',
        description: `${plan.name} subscription for ${orgName || 'Organization'}`,
        metadata: {
          orgId,
          planCode,
          type: 'subscription',
          source: 'adminer',
          userEmail: userEmail || null,
          orgName: orgName || null
        },
        success_url: `${this.appUrl}/dashboard?payment=success&plan=${planCode}&session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.appUrl}/pricing?payment=cancelled&plan=${planCode}`
      };

      console.log('DODO_PAYLOAD:', payload);

      // If no API keys configured, return mock response for development
      if (!this.apiKey || !this.secretKey) {
        console.log('DODO_MOCK_MODE: Returning mock checkout session');
        return {
          success: true,
          checkout_url: `${this.appUrl}/mock-payment?plan=${planCode}&amount=${plan.price}`,
          session_id: `mock_${Date.now()}`,
          plan: plan,
          mock_mode: true
        };
      }

      // Make actual API call to Dodo
      const response = await fetch(`${this.apiUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Dodo API error: ${result.message || response.statusText}`);
      }

      console.log('DODO_CHECKOUT_SUCCESS:', {
        sessionId: result.id,
        checkoutUrl: result.url,
        planCode
      });

      return {
        success: true,
        checkout_url: result.url,
        session_id: result.id,
        plan: plan
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