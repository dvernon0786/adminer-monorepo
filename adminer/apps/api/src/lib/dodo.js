const crypto = require('crypto');

class DodoClient {
  constructor() {
    this.apiKey = process.env.DODO_PAYMENTS_API_KEY;
    this.secretKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    this.environment = process.env.DODO_PAYMENTS_ENVIRONMENT || 'test';
    this.proCheckoutUrl = process.env.DODO_CHECKOUT_PRO_URL;
    this.entCheckoutUrl = process.env.DODO_CHECKOUT_ENT_URL;
    this.returnUrl = process.env.DODO_PAYMENTS_RETURN_URL || 'https://adminer.online/dashboard';
    
    console.log('🔧 DODO_CLIENT_INIT_V5', {
      hasApiKey: !!this.apiKey,
      hasSecretKey: !!this.secretKey,
      environment: this.environment,
      hasProUrl: !!this.proCheckoutUrl,
      hasEntUrl: !!this.entCheckoutUrl,
      proUrlPrefix: this.proCheckoutUrl ? this.proCheckoutUrl.substring(0, 50) + '...' : 'none',
      entUrlPrefix: this.entCheckoutUrl ? this.entCheckoutUrl.substring(0, 50) + '...' : 'none'
    });
  }

  async createCheckoutSession(checkoutData) {
    console.log('🚀 DODO_CREATE_CHECKOUT_V5', {
      timestamp: new Date().toISOString(),
      productId: checkoutData.product_cart?.[0]?.product_id,
      customerEmail: checkoutData.customer?.email,
      useConfiguredUrls: true
    });

    try {
      // Handle free plan immediately
      if (checkoutData.product_cart && 
          checkoutData.product_cart[0] && 
          checkoutData.product_cart[0].product_id === 'prod_free_plan') {
        console.log('✅ DODO_FREE_PLAN_ACTIVATION_V5');
        return {
          success: true,
          checkout_url: null,
          session_id: `free_${Date.now()}`,
          plan: { name: 'Free Plan', price: 0 },
          immediate_activation: true,
          redirect_url: `${this.returnUrl}?plan=free&activated=true`
        };
      }

      // Use configured checkout URLs instead of API calls
      const productId = checkoutData.product_cart[0].product_id;
      let checkoutUrl = null;
      let planName = '';
      let price = 0;

      if (productId === 'prod_pro_plan') {
        checkoutUrl = this.proCheckoutUrl;
        planName = 'Pro Plan';
        price = 9900;
        console.log('📦 DODO_PRO_PLAN_SELECTED_V5', {
          productId: productId,
          checkoutUrl: checkoutUrl
        });
      } else if (productId === 'prod_enterprise_plan') {
        checkoutUrl = this.entCheckoutUrl;
        planName = 'Enterprise Plan';
        price = 19900;
        console.log('📦 DODO_ENTERPRISE_PLAN_SELECTED_V5', {
          productId: productId,
          checkoutUrl: checkoutUrl
        });
      } else {
        console.log('❌ DODO_UNKNOWN_PRODUCT_V5', {
          productId: productId,
          availableProducts: ['prod_pro_plan', 'prod_enterprise_plan']
        });
        throw new Error(`Unknown product ID: ${productId}`);
      }

      // Validate that we have the checkout URL
      if (!checkoutUrl) {
        console.log('❌ DODO_MISSING_CHECKOUT_URL_V5', {
          productId: productId,
          hasProUrl: !!this.proCheckoutUrl,
          hasEntUrl: !!this.entCheckoutUrl
        });
        throw new Error(`No checkout URL configured for ${productId}`);
      }

      // Add return URL parameters to checkout URL
      const urlObj = new URL(checkoutUrl);
      urlObj.searchParams.set('redirect_url', encodeURIComponent(`${this.returnUrl}?upgrade=success&plan=${productId}`));
      
      const finalCheckoutUrl = urlObj.toString();

      console.log('✅ DODO_CONFIGURED_URL_SUCCESS_V5', {
        originalUrl: checkoutUrl,
        finalUrl: finalCheckoutUrl,
        planName: planName,
        price: price
      });

      // Return successful response with configured URL
      const sessionId = `configured_${Date.now()}_${productId}`;
      
      return {
        success: true,
        checkout_url: finalCheckoutUrl,
        session_id: sessionId,
        plan: { 
          name: planName, 
          price: price 
        },
        customer: checkoutData.customer,
        configured_url: true,
        message: 'Using configured Dodo checkout URL'
      };

    } catch (error) {
      console.error('💥 DODO_CONFIGURED_URL_ERROR_V5', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Return error response
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
        console.log('⚠️ DODO_WEBHOOK_NO_SECRET_KEY_V5');
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

      console.log('🔐 DODO_WEBHOOK_VERIFICATION_V5', {
        isValid: isValid,
        hasSignature: !!signature
      });

      return isValid;
    } catch (error) {
      console.error('💥 DODO_WEBHOOK_VERIFICATION_ERROR_V5', error);
      return false;
    }
  }

  async createCustomer(orgId, userEmail = null, orgName = null) {
    try {
      console.log('👤 DODO_CREATE_CUSTOMER_V5', {
        orgId: orgId,
        userEmail: userEmail,
        orgName: orgName
      });

      // For configured URLs approach, we don't need to create customers via API
      // Return a mock customer ID for compatibility
      const customerId = `cust_${orgId}_${Date.now()}`;
      
      console.log('✅ DODO_CUSTOMER_CREATED_V5', {
        customerId: customerId,
        orgId: orgId
      });

      return {
        id: customerId,
        external_id: orgId,
        email: userEmail,
        name: orgName,
        configured_url_mode: true
      };

    } catch (error) {
      console.error('💥 DODO_CREATE_CUSTOMER_ERROR_V5', error);
      throw error;
    }
  }
}

module.exports = new DodoClient();