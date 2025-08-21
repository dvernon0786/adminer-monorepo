const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public');
const out = path.join(outDir, 'env.js');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Try multiple environment variable names for maximum compatibility
const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
            process.env.VITE_CLERK_PUBLISHABLE_KEY || 
            process.env.CLERK_PUBLISHABLE_KEY || '';

// Debug logging
console.log('Environment variables available:');
console.log('- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
console.log('- VITE_CLERK_PUBLISHABLE_KEY:', process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
console.log('- CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
console.log('- Final key length:', key.length);

fs.writeFileSync(out, `window.__env__={VITE_CLERK_PUBLISHABLE_KEY:${JSON.stringify(key)}};`);
console.log('Wrote /public/env.js with VITE_CLERK_PUBLISHABLE_KEY'); 