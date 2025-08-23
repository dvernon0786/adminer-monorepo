// apps/api/scripts/check-csp.cjs
/* eslint-disable no-console */
const path = require('path');
const { pathToFileURL } = require('url');

async function main() {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

  // Run only on preview and development builds
  if (env === 'production') {
    console.log('[check-csp] Skipping in production builds ✅');
    return;
  }

  // Resolve and import next.config.mjs at runtime (ESM)
  const configPath = path.resolve(__dirname, '../next.config.mjs');
  const configUrl = pathToFileURL(configPath).href;
  let nextConfig;
  try {
    const mod = await import(configUrl);
    nextConfig = mod.default || mod;
  } catch (err) {
    console.error('[check-csp] Failed to load next.config.mjs:', err);
    process.exit(1);
  }

  if (typeof nextConfig.headers !== 'function') {
    console.error('[check-csp] next.config.mjs has no async headers() function.');
    process.exit(1);
  }

  let headersList;
  try {
    headersList = await nextConfig.headers();
  } catch (err) {
    console.error('[check-csp] Error executing headers():', err);
    process.exit(1);
  }

  if (!Array.isArray(headersList) || headersList.length === 0) {
    console.error('[check-csp] headers() returned empty list.');
    process.exit(1);
  }

  // Find the catch-all rule (source '/(.*)') where CSP should be set
  const allRule =
    headersList.find(h => h.source === '/(.*)') ||
    headersList[0];

  const cspHeader =
    (allRule.headers || []).find(h => h.key.toLowerCase() === 'content-security-policy');

  if (!cspHeader) {
    console.error('[check-csp] Missing Content-Security-Policy header on /(.*).');
    process.exit(1);
  }

  const csp = String(cspHeader.value || '');
  const requireContains = (needle, msg) => {
    if (!csp.includes(needle)) {
      console.error(`[check-csp] Missing directive: ${msg} (expected to include: ${needle})`);
      process.exit(1);
    }
  };

  // Baseline directives we rely on
  requireContains("default-src 'self'", "default-src 'self'");
  requireContains("script-src 'self' 'unsafe-inline'", "script-src baseline");
  // In non-prod we expect 'unsafe-eval' to be present (to unblock dev tooling)
  requireContains("'unsafe-eval'", "script-src 'unsafe-eval' for preview/dev");

  // Google Fonts (CSS+files)
  requireContains('style-src', 'style-src present');
  requireContains('https://fonts.googleapis.com', 'Google Fonts stylesheet domain');
  requireContains('font-src', 'font-src present');
  requireContains('https://fonts.gstatic.com', 'Google Fonts file domain');

  // Clerk endpoints
  requireContains('connect-src', 'connect-src present');
  requireContains('https://api.clerk.com', 'Clerk API domain');
  requireContains('https://clerk.adminer.online', 'Your Clerk loader/proxy domain');

  // Hardening presence (don't over-validate exact syntax to keep it resilient)
  ['base-uri', 'form-action', 'frame-ancestors', 'object-src'].forEach((dir) => {
    if (!csp.includes(dir)) {
      console.error(`[check-csp] Hardening directive missing: ${dir}`);
      process.exit(1);
    }
  });

  console.log('[check-csp] OK: CSP present and valid for preview/dev ✅');
}

main().catch((e) => {
  console.error('[check-csp] Unexpected error:', e);
  process.exit(1);
}); 