#!/usr/bin/env node
/**
 * Ensures CSP allows the Clerk proxy origin.
 *
 * What it checks (any one of script-src OR script-src-elem is fine):
 *  - connect-src includes <proxyOrigin>
 *  - script-src-elem OR script-src includes <proxyOrigin>
 *  - frame-src includes <proxyOrigin>   (for Clerk components/iframes)
 *
 * Fails the build with actionable guidance if missing.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_CONFIG = path.join(process.cwd(), '.vercel', 'output', 'config', 'routes.json');

// Prefer the value you use at runtime (the SPA writes this from write-env.cjs)
const PROXY_URL =
  process.env.CLERK_PROXY_URL ||
  process.env.NEXT_PUBLIC_CLERK_PROXY_URL ||
  process.env.VITE_CLERK_PROXY_URL ||
  process.env.CLERK_FRONTEND_API || // last-ditch, host-only (legacy)
  '';

function toOrigin(u) {
  try {
    const url = new URL(u.startsWith('http') ? u : `https://${u}`);
    return `${url.protocol}//${url.host}`;
  } catch {
    return '';
  }
}

function parseCSP(cspValue) {
  const map = new Map();
  if (!cspValue) return map;
  const parts = cspValue.split(';').map(s => s.trim()).filter(Boolean);
  for (const p of parts) {
    const [name, ...rest] = p.split(/\s+/);
    map.set(name.toLowerCase(), rest);
  }
  return map;
}

function hasSource(list, origin) {
  if (!Array.isArray(list)) return false;
  // allow either the bare origin or a wildcard that covers it
  return list.includes(origin) || list.includes('*') || list.some(s => s.endsWith('.adminer.online') && origin.includes('.adminer.online'));
}

(function main() {
  const proxyOrigin = toOrigin(PROXY_URL);
  if (!proxyOrigin) {
    console.warn('[check-csp-clerk] ⚠️  No CLERK_PROXY_URL detected; skipping Clerk CSP verification.');
    process.exit(0);
  }

  let routes;
  try {
    routes = JSON.parse(fs.readFileSync(OUTPUT_CONFIG, 'utf8'));
  } catch (err) {
    console.error('[check-csp-clerk] ❌ Unable to read routes.json at', OUTPUT_CONFIG, err.message);
    process.exit(1);
  }

  // Find any route that sets a Content-Security-Policy header (global or page-level)
  const cspHeaders = [];
  for (const r of routes || []) {
    if (!r || !Array.isArray(r.headers)) continue;
    for (const h of r.headers) {
      if (!h || !Array.isArray(h.headers)) continue;
      const csp = h.headers.find(kv => (kv.key || '').toLowerCase() === 'content-security-policy');
      if (csp && csp.value) cspHeaders.push({ route: r.src || r.pathname || 'unknown', value: csp.value });
    }
  }

  if (cspHeaders.length === 0) {
    console.error('[check-csp-clerk] ❌ No Content-Security-Policy header found in build output.');
    process.exit(1);
  }

  // Use the first CSP we find (usually the global one). If you have multiple, consider tightening this for your setup.
  const { value: cspValue } = cspHeaders[0];
  const csp = parseCSP(cspValue);

  const connect = csp.get('connect-src') || [];
  const script   = csp.get('script-src') || [];
  const scriptEl = csp.get('script-src-elem') || [];
  const frame    = csp.get('frame-src') || [];

  const missing = [];

  if (!hasSource(connect, proxyOrigin)) missing.push(`connect-src ${proxyOrigin}`);
  if (!(hasSource(scriptEl, proxyOrigin) || hasSource(script, proxyOrigin))) {
    missing.push(`script-src or script-src-elem ${proxyOrigin}`);
  }
  if (!hasSource(frame, proxyOrigin)) missing.push(`frame-src ${proxyOrigin}`);

  if (missing.length) {
    console.error(''); // spacing
    console.error('[check-csp-clerk] ❌ CSP is missing required Clerk proxy allowances:');
    for (const m of missing) console.error('  -', m);

    // Nice remediation snippet
    const example = [
      `connect-src 'self' ${proxyOrigin} https://*.ingest.sentry.io;`,
      `script-src 'self' 'unsafe-inline' ${proxyOrigin};`,
      `script-src-elem 'self' ${proxyOrigin};`,
      `frame-src 'self' ${proxyOrigin};`,
    ].join(' ');

    console.error('');
    console.error('[check-csp-clerk] 💡 Add the proxy origin to your CSP. Example directive value:');
    console.error(example);
    console.error('');
    console.error('If you generate headers in next.config.mjs, ensure the Content-Security-Policy includes the above tokens.');
    process.exit(1);
  }

  console.log(`[check-csp-clerk] ✅ Clerk proxy origin allowed by CSP: ${proxyOrigin}`);
})(); 