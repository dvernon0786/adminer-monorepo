const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = process.cwd(); // adminer/
const forbidden = path.resolve(repoRoot, '..', 'apps', 'web', 'src', 'main.tsx');

if (fs.existsSync(forbidden)) {
  console.error('\n[guard-repo] Duplicate main.tsx detected at:', forbidden);
  console.error('Remove the parent-level apps/ tree. Build aborted.\n');
  process.exit(1);
}
console.log('[guard-repo] OK'); 