import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production builds, environment variables are already set by Vercel
// We don't need to load .env files, just check if the variables exist

// Check required Dodo environment variables
const required = [
  'DODO_API_KEY', 
  'DODO_FREE_PRODUCT_ID', 
  'DODO_PRO_PRODUCT_ID', 
  'DODO_ENT_PRODUCT_ID'
];

const missing = [];
const found = [];

for (const key of required) {
  if (process.env[key]) {
    found.push(key);
    console.log(`${key}: SET`);
  } else {
    missing.push(key);
    console.log(`${key}: MISSING`);
  }
}

if (missing.length > 0) {
  console.error(`❌ Missing required Dodo environment variables: ${missing.join(', ')}`);
  console.error(`Please ensure these are set in your Vercel environment variables.`);
  process.exit(1);
}

console.log(`✅ Dodo environment variables validated`);
console.log(`Environment variables found: [${found.join(', ')}]`); 