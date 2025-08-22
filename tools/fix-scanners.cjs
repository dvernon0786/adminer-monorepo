const fs = require('fs');

function fixFile(path) {
  let s = fs.readFileSync(path, 'utf8');

  // Remove ALL existing isDocsFile function declarations
  s = s.replace(/\/\/[^\n]*isDocsFile[^\n]*\n/g, ''); // Remove comments about isDocsFile
  s = s.replace(/function\s+isDocsFile\s*\([^}]+}\s*/g, ''); // Remove function declarations
  s = s.replace(/const\s+isDocsFile\s*=\s*\([^}]+};\s*/g, ''); // Remove const declarations

  // Ensure helper import exists at the top (after imports)
  if (!/require\(["']\.\/hardcoded-scan\.shared["']\)/.test(s)) {
    const importMatch = s.match(/(import[^;]+;\s*)+/);
    if (importMatch) {
      const afterImports = importMatch[0];
      s = s.replace(afterImports, afterImports + 'const { isDocsFile } = require("./hardcoded-scan.shared");\n\n');
    } else {
      s = 'const { isDocsFile } = require("./hardcoded-scan.shared");\n\n' + s;
    }
  }

  // Fix console string multiplications
  s = s.replace(/"="\s*\*\s*80/g, '"=".repeat(80)');
  s = s.replace(/"-"\s*\*\s*40/g, '"-".repeat(40)');

  fs.writeFileSync(path, s);
  console.log(`Fixed: ${path}`);
}

['tools/hardcoded-scan.ts','tools/hardcoded-scan.diff.ts'].forEach(p => {
  if (fs.existsSync(p)) fixFile(p); else console.error(`Missing ${p}`);
});
