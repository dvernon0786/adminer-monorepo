
// Dodo Payments Configuration Lock - Architecture Lock Phase 1
// This file locks the Dodo payment integration patterns to prevent regression

class DodoConfigLock {
  constructor() {
    this.config = {
      mode: process.env.DODO_MODE || 'test',
      apiBase: process.env.DODO_API_BASE,
      apiKey: process.env.DODO_API_KEY,
      secretKey: process.env.DODO_SECRET_KEY,
      webhookSecret: process.env.DODO_WEBHOOK_SECRET,
      productFree: process.env.DODO_PRODUCT_FREE,
      pricePro: process.env.DODO_PRICE_PRO,
      priceEnterprise: process.env.DODO_PRICE_ENTERPRISE,
      currency: process.env.DODO_CURRENCY || 'usd'
    };
    
    this.validateConfig();
  }

  validateConfig() {
    if (!this.config.apiBase) {
      throw new Error('DODO_API_BASE is required');
    }
    if (!this.config.apiKey) {
      throw new Error('DODO_API_KEY is required');
    }
    if (!this.config.secretKey) {
      throw new Error('DODO_SECRET_KEY is required');
    }
  }

  getPaymentConfig() {
    return {
      mode: this.config.mode,
      apiBase: this.config.apiBase,
      apiKey: this.config.apiKey,
      secretKey: this.config.secretKey,
      webhookSecret: this.config.webhookSecret,
      products: {
        free: this.config.productFree,
        pro: this.config.pricePro,
        enterprise: this.config.priceEnterprise
      },
      currency: this.config.currency
    };
  }

  getCheckoutUrl(plan) {
    const productId = plan === 'pro' ? this.config.pricePro : this.config.priceEnterprise;
    if (!productId) {
      throw new Error(`Product ID not configured for plan: ${plan}`);
    }
    return `${this.config.apiBase}/checkout/${productId}`;
  }
}

module.exports = { DodoConfigLock };
