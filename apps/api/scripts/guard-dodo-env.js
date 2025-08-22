import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local if it exists
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  config({ path: envPath, override: true });
}

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
  process.exit(1);
}

console.log(`✅ Dodo environment variables validated`);
console.log(`Environment variables found: [${found.join(', ')}]`); 