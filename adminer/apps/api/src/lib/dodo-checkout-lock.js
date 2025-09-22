
// Dodo Payments Checkout Lock - Architecture Lock Phase 2
// This file locks the working Dodo payment checkout patterns

const { DodoConfigLock } = require('./dodo-config.js');

class DodoCheckoutLock {
  constructor() {
    this.config = new DodoConfigLock();
    this.checkoutPatterns = this.initializeCheckoutPatterns();
  }

  initializeCheckoutPatterns() {
    return {
      // Lock the working checkout session creation
      sessionCreation: {
        method: 'POST',
        endpoint: '/checkout-sessions',
        headers: {
          'Authorization': `Bearer ${this.config.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Adminer/1.0'
        }
      },
      
      // Lock the working product mapping
      products: {
        'pro-500': {
          productId: this.config.config.pricePro,
          price: 9900,
          name: 'Pro Plan',
          quota: 500
        },
        'ent-2000': {
          productId: this.config.config.priceEnterprise,
          price: 19900,
          name: 'Enterprise Plan',
          quota: 2000
        }
      },
      
      // Lock the working checkout data structure
      checkoutData: {
        product_cart: [
          {
            product_id: 'dynamic',
            quantity: 1
          }
        ],
        customer: {
          email: 'dynamic',
          name: 'dynamic'
        },
        return_url: 'dynamic',
        cancel_url: 'dynamic',
        metadata: {
          organization_id: 'dynamic',
          plan: 'dynamic',
          source: 'adminer_quota_modal',
          user_id: 'dynamic',
          workspace_id: 'dynamic'
        }
      }
    };
  }

  // Lock the working checkout session creation pattern
  async createCheckoutSession(planCode, orgId, userEmail, userName) {
    const product = this.checkoutPatterns.products[planCode];
    if (!product) {
      throw new Error(`Invalid plan code: ${planCode}`);
    }

    const checkoutData = {
      ...this.checkoutPatterns.checkoutData,
      product_cart: [{
        product_id: product.productId,
        quantity: 1
      }],
      customer: {
        email: userEmail,
        name: userName || userEmail.split('@')[0]
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`,
      metadata: {
        organization_id: orgId,
        plan: planCode,
        source: 'adminer_quota_modal',
        user_id: orgId,
        workspace_id: orgId
      }
    };

    console.log('💳 DODO_CHECKOUT_SESSION_LOCK', {
      planCode,
      productId: product.productId,
      price: product.price,
      orgId,
      timestamp: new Date().toISOString()
    });

    // This pattern must not be modified to prevent regression
    return checkoutData;
  }

  getCheckoutPatterns() {
    return this.checkoutPatterns;
  }
}

module.exports = { DodoCheckoutLock };
