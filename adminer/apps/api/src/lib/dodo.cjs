const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

// Handle fetch compatibility across Node versions
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  // Node < 18 - use node-fetch
  try {
    fetch = require('node-fetch');
  } catch (error) {
    throw new Error('fetch is not available. Install node-fetch for Node.js < 18: npm install node-fetch');
  }
} else {
  // Node 18+ - use native fetch
  fetch = globalThis.fetch;
}

class DodoClient {
  constructor() {
    this.apiKey = process.env.DODO_API_KEY;
    this.secretKey = process.env.DODO_SECRET_KEY;
    this.apiUrl = process.env.DODO_API_URL || 'https://api.dodo.dev/v1';
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adminer.online';
    
    // Validate required configuration
    if (!this.apiKey) {
      console.warn('DODO_API_KEY not configured');
    }
    if (!this.secretKey) {
      console.warn('DODO_SECRET_KEY not configured');
    }
  }

  async createCheckoutSession(planCode, orgId, orgName = null) {
    if (!this.apiKey) {
      throw new Error('DODO_API_KEY is not configured');
    }

    const planMap = {
      'pro-500': { price: 4900, name: 'Pro Plan' },
      'ent-2000': { price: 19900, name: 'Enterprise Plan' }
    };

    const plan = planMap[planCode];
    if (!plan) {
      throw new Error(`Invalid plan code: ${planCode}`);
    }

    const payload = {
      amount: plan.price,
      currency: 'usd',
      description: `${plan.name} subscription for ${orgName || orgId}`,
      metadata: {
        orgId,
        planCode,
        type: 'subscription',
        source: 'adminer'
      },
      success_url: `${this.appUrl}/dashboard?payment=success&plan=${planCode}`,
      cancel_url: `${this.appUrl}/upgrade?payment=cancelled&plan=${planCode}`
    };

    console.log('Creating Dodo checkout session:', { planCode, orgId, amount: plan.price });

    try {
      const response = await fetch(`${this.apiUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Unknown API error';
        }
        throw new Error(`Dodo API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('Dodo checkout session created:', result.id);
      return result;
    } catch (error) {
      console.error('Failed to create Dodo checkout session:', error);
      throw error;
    }
  }

  verifyWebhook(payload, signature) {
    if (!signature || !this.secretKey) {
      console.error('Missing webhook signature or secret key');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload, 'utf8')
        .digest('hex');

      const expectedHeader = `sha256=${expectedSignature}`;
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedHeader, 'utf8')
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  async createCustomer(orgId, email = null) {
    if (!this.apiKey) {
      throw new Error('DODO_API_KEY is not configured');
    }

    const payload = {
      external_id: orgId,
      email,
      metadata: { 
        source: 'adminer',
        created_at: new Date().toISOString()
      }
    };

    try {
      const response = await fetch(`${this.apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Unknown API error';
        }
        throw new Error(`Dodo customer creation error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create Dodo customer:', error);
      throw error;
    }
  }
}

module.exports = { DodoClient };
