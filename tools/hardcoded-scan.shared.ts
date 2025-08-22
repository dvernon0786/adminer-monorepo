// tools/hardcoded-scan.shared.ts
const isDocsFile = (p: string): boolean => {
  const lower = p.replace(/\\/g, "/").toLowerCase();
  if (lower.includes("/docs/")) return true;
  if (lower.includes("/doc/")) return true;
  if (/readme(\.[^/]+)?$/i.test(lower)) return true;
  if (/\.(md|mdx|adoc|rst|txt)$/i.test(lower)) return true;
  if (/\.env\.example$/i.test(lower)) return true;
  if (/(^|\/)(example|samples?)\//i.test(lower)) return true;
  // Scanner config + scanner sources:
  if (/(^|\/)(tools|scripts)\/hardcoded-scan\.config\.json$/.test(lower)) return true;
  if (/(^|\/)(tools|scripts)\/hardcoded-scan(\.diff)?\.ts$/.test(lower)) return true;
  return false;
};

module.exports = { isDocsFile }; 