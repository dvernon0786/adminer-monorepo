// Deployment verification for DirectCheckoutModal fix
export const DEPLOYMENT_VERSION = 'DIRECT_CHECKOUT_FIX_V3_' + new Date().toISOString();
export const BUILD_TIMESTAMP = Date.now();

console.log('DEPLOYMENT_VERIFICATION', {
  version: DEPLOYMENT_VERSION,
  buildTime: BUILD_TIMESTAMP,
  component: 'DirectCheckoutModal'
});