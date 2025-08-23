// apps/api/scripts/check-csp.cjs
/* eslint-disable no-console */
const path = require('path');
const { pathToFileURL } = require('url');

async function main() {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  const isProd = env === 'production';

  // Run only on preview and development builds
  if (isProd) {
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
  
  // Parse CSP into directive map
  const map = {};
  csp.split(';').forEach(line => {
    const trimmed = line.trim();
    if (trimmed) {
      const [directive, ...values] = trimmed.split(' ');
      if (directive && values.length > 0) {
        map[directive] = values.join(' ');
      }
    }
  });

  function fail(msg) {
    console.error(`[check-csp] ❌ ${msg}`);
    process.exit(1);
  }

  function assertContains(directive, expects, label = 'required') {
    const line = map[directive];
    if (!line) {
      fail(`Missing directive: ${directive} (${label})`);
    }
    for (const token of expects) {
      if (!line.includes(token)) {
        fail(`Missing directive: ${directive} expected to include: ${token} (${label})`);
      }
    }
  }

  // On non‑prod we REQUIRE 'unsafe-eval' so dev/preview builds pass with Clerk.
  const requiredForPreview = isProd ? {} : {
    'script-src': ["'unsafe-eval'"],
    // Note: 'unsafe-eval' is not valid in script-src-elem
  };

  // With reverse-proxy setup, we only need 'self' for most directives since Clerk calls go through /clerk/*
  const requiredAlways = {
    'style-src-elem': ['https://fonts.googleapis.com'],
    'font-src': ['https://fonts.gstatic.com', 'data:'],
    'connect-src': [
      "'self'",
      'https://api.dodopayments.com'  // Only external API we still need
    ],
    'script-src-elem': [
      "'self'",
      "'unsafe-inline'"
    ],
    'script-src': [
      "'self'",
      "'unsafe-inline'"
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'default-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': [
      "'self'"
    ],
    'img-src': ["'self'", 'data:', 'https:'],
  };

  console.log(`[check-csp] 🔍 Validating CSP for ${env} environment...`);
  console.log(`[check-csp] 📋 CSP directives found: ${Object.keys(map).join(', ')}`);

  // required always
  for (const [dir, vals] of Object.entries(requiredAlways)) {
    assertContains(dir, vals, 'always');
  }

  // preview/dev only requirements
  for (const [dir, vals] of Object.entries(requiredForPreview)) {
    assertContains(dir, vals, 'preview/dev');
  }

  console.log(`[check-csp] ✅ CSP present and valid for ${env} environment`);
  console.log(`[check-csp] 🎯 All required directives present and properly configured`);
  console.log(`[check-csp] 🔒 Reverse-proxy mode: Clerk calls routed through /clerk/* proxy`);
}

main().catch((e) => {
  console.error('[check-csp] Unexpected error:', e);
  process.exit(1);
}); 