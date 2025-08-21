const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public');
const out = path.join(outDir, 'env.js');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
fs.writeFileSync(out, `window.__env__={VITE_CLERK_PUBLISHABLE_KEY:${JSON.stringify(key)}};`);
console.log('Wrote /public/env.js with NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'); 