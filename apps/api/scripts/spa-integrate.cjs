/* apps/api/scripts/spa-integrate.cjs */
/* eslint-disable no-console */
const { execSync } = require('child_process');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const webDir = path.resolve(root, 'web');
const apiDir = path.resolve(__dirname, '..');
const publicDir = path.join(apiDir, 'public');
const distDir = path.join(webDir, 'dist');

function sh(cmd, cwd) {
  console.log(`→ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: cwd || process.cwd() });
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function fileExists(p) {
  try { await fsp.access(p, fs.constants.F_OK); return true; } catch { return false; }
}

async function main() {
  console.log('== SPA Integrate ==');
  console.log(`root=${root}`);
  console.log(`webDir=${webDir}`);
  console.log(`apiDir=${apiDir}`);
  console.log(`publicDir=${publicDir}`);

  // 1) Build SPA
  sh('npm ci', webDir);          // ensure deps present on Vercel builder
  sh('npm run build', webDir);   // produces web/dist

  // 2) Validate build output
  const hasIndex = await fileExists(path.join(distDir, 'index.html'));
  if (!hasIndex) {
    console.error('✗ Missing dist/index.html after SPA build');
    process.exit(1);
  }

  // 3) Rewrite /public/assets/ → /assets/ in index.html (surgical)
  const indexPath = path.join(distDir, 'index.html');
  let html = await fsp.readFile(indexPath, 'utf8');
  const before = html;
  html = html
    .replaceAll('href="/public/assets/', 'href="/assets/')
    .replaceAll('src="/public/assets/', 'src="/assets/');
  if (html !== before) {
    await fsp.writeFile(indexPath, html, 'utf8');
    console.log('✓ Rewrote asset prefixes in index.html');
  } else {
    console.log('ℹ︎ No /public/assets/ references found in index.html');
  }

  // 4) Copy to apps/api/public (clean + sync)
  await ensureDir(publicDir);

  // remove existing public (excluding .keep if you use one)
  const entries = await fsp.readdir(publicDir);
  await Promise.all(entries.map(async (e) => {
    const p = path.join(publicDir, e);
    await fsp.rm(p, { recursive: true, force: true });
  }));

  // copy dist/*
  sh(`cp -R "${distDir}/." "${publicDir}/"`);

  // 5) Guards
  const finalIndex = path.join(publicDir, 'index.html');
  if (!(await fileExists(finalIndex))) {
    console.error('✗ Guard fail: missing apps/api/public/index.html');
    process.exit(1);
  }
  const finalHtml = await fsp.readFile(finalIndex, 'utf8');
  if (finalHtml.includes('/public/assets/')) {
    console.error('✗ Guard fail: index.html still references /public/assets/');
    process.exit(1);
  }

  console.log('✓ SPA integrated into apps/api/public');
}

main().catch((err) => {
  console.error('✗ spa-integrate failed:', err);
  process.exit(1);
}); 