import fs from 'fs';
import path from 'path';

const checks = [
  'package.json',
  'app/api/consolidated/route.ts',
  '../web/package.json'
];

let ok = true;
for (const p of checks) {
  const full = path.join(process.cwd(), p);
  if (!fs.existsSync(full)) {
    console.error(`❌ Missing required file: ${p}`);
    ok = false;
  } else {
    console.log(`✅ Found: ${p}`);
  }
}

if (!ok) {
  console.error('Guard failed. Ensure required files exist.');
  process.exit(1);
} else {
  console.log('🛡  Guard checks passed.');
} 