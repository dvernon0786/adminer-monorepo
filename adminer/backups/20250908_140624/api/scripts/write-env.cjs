const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, '..', 'public', 'env.js');
const pk = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

if (!pk) {
  console.error('[write-env] ❌ Missing CLERK_PUBLISHABLE_KEY. Refusing to emit a blank env.js');
  process.exit(1);
}

// Escape any accidental quotes
const safe = String(pk).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
fs.writeFileSync(out, `window.__ENV={CLERK_PUBLISHABLE_KEY:"${safe}"};`);
console.log('[write-env] ✅ Wrote env.js with publishable key'); 