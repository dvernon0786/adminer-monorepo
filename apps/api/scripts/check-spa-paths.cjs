#!/usr/bin/env node

/**
 * Post-build sanity checks for SPA assets.
 * Fails the build if:
 *  - /public/index.html is missing
 *  - /public/assets is missing or empty
 *  - Any src/href in index.html begins with "/public/"
 *  - Any referenced "/assets/*" file is missing
 *  - /public/env.js is missing
 */

const fs = require('fs');
const path = require('path');

const apiDir = process.cwd(); // run from apps/api
const publicDir = path.join(apiDir, 'public');
const indexHtml = path.join(publicDir, 'index.html');
const assetsDir = path.join(publicDir, 'assets');
const envJs = path.join(publicDir, 'env.js');

function fail(msg, details) {
  console.error(`[check-spa-paths] ERROR: ${msg}`);
  if (details) console.error(details);
  process.exit(1);
}

function ok(msg) {
  console.log(`[check-spa-paths] ${msg}`);
}

if (!fs.existsSync(publicDir)) fail('Missing /public directory.');

if (!fs.existsSync(indexHtml)) fail('Missing /public/index.html.');

if (!fs.existsSync(envJs)) fail('Missing /public/env.js (written by prebuild).');

if (!fs.existsSync(assetsDir)) fail('Missing /public/assets directory.');

const assets = fs.readdirSync(assetsDir).filter(Boolean);
if (assets.length === 0) fail('No assets found in /public/assets.');

const html = fs.readFileSync(indexHtml, 'utf8');

// 1) forbid "/public/" in any src/href
const attrRegex = /\b(?:src|href)\s*=\s*"(.*?)"/g;
let m;
const bad = [];
const assetRefs = new Set();

while ((m = attrRegex.exec(html)) !== null) {
  const url = m[1].trim();
  if (!url) continue;

  if (url.startsWith('/public/')) {
    bad.push(url);
  }
  if (url.startsWith('/assets/')) {
    assetRefs.add(url.replace('/assets/', ''));
  }
}

if (bad.length) {
  fail('index.html references /public/* paths. They must be /assets/* or root.', bad.join('\n'));
}

// 2) ensure each referenced /assets/* exists
const missing = [];
for (const rel of assetRefs) {
  const f = path.join(assetsDir, rel);
  if (!fs.existsSync(f)) missing.push(`/assets/${rel}`);
}
if (missing.length) {
  fail('index.html references missing assets:', missing.join('\n'));
}

ok(`OK: ${assets.length} assets validated, assets path prefix is "/assets/", index.html clean ✅`);
process.exit(0); 