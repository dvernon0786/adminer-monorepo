/* apps/api/scripts/check-spa-paths.cjs */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const idx = path.resolve(__dirname, '../../public/index.html');
if (!fs.existsSync(idx)) {
  console.error('✗ Missing apps/api/public/index.html for path check');
  process.exit(1);
}

const html = fs.readFileSync(idx, 'utf8');
if (html.includes('/public/assets/')) {
  console.error('✗ Found /public/assets/ reference in public/index.html');
  process.exit(1);
}

console.log('✓ No /public/assets/ references found'); 