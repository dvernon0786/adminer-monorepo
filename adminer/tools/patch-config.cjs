const fs = require('fs');
const path = 'tools/hardcoded-scan.config.json';
if (!fs.existsSync(path)) {
  console.error('Missing tools/hardcoded-scan.config.json');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(path, 'utf8'));

const TARGET_ID = 'CLERK_KEYS';
const NEW_REGEX = '(?<![A-Za-z0-9])(?:pk|sk)[-_][A-Za-z0-9_-]{12,}(?![A-Za-z0-9_-])';
const WL_ADD = [
  'sk_live_1234567890abcdef',
  'pk_live_1234567890abcdef',
  'sk-live-EXAMPLE_EXAMPLE_EXAMPLE',
  'pk-live-EXAMPLE_EXAMPLE_EXAMPLE'
];

if (Array.isArray(cfg.patterns)) {
  const p = cfg.patterns.find(x => x && x.id === TARGET_ID);
  if (p) p.regex = NEW_REGEX;
  else cfg.patterns.push({ id: TARGET_ID, description: 'Clerk publishable/secret keys', severity: 'high', regex: NEW_REGEX });
} else {
  cfg.patterns = [{ id: TARGET_ID, description: 'Clerk publishable/secret keys', severity: 'high', regex: NEW_REGEX }];
}

if (!Array.isArray(cfg.whitelist)) cfg.whitelist = [];
for (const tok of WL_ADD) if (!cfg.whitelist.includes(tok)) cfg.whitelist.push(tok);

fs.writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n');
console.log('Patched config:', path);
