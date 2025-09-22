const dodo = require('./adminer/apps/api/src/lib/dodo.js');

console.log('🧪 Testing V5 URL Parameter Fix...');

// Test Pro plan with corrected URL parameters
const proTest = {
  product_cart: [{ product_id: 'prod_pro_plan', quantity: 1 }],
  customer: { email: 'test@example.com', name: 'Test User' }
};

console.log('\n📦 Testing Pro Plan with corrected return_url parameter:');
dodo.createCheckoutSession(proTest).then(result => {
  console.log('Pro Plan Result:', {
    success: result.success,
    hasCheckoutUrl: !!result.checkout_url,
    configuredUrl: result.configured_url,
    planName: result.plan?.name,
    error: result.error
  });
  
  if (result.checkout_url) {
    const url = new URL(result.checkout_url);
    console.log('URL Parameters:', {
      hasReturnUrl: url.searchParams.has('return_url'),
      returnUrlValue: url.searchParams.get('return_url'),
      hasRedirectUrl: url.searchParams.has('redirect_url')
    });
  }
}).catch(err => {
  console.error('Pro Plan Error:', err.message);
});