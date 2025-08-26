export function isDocsFile(p: string): boolean {
  const lower = p.replace(/\\/g, "/").toLowerCase();

  // Documentation & prose
  if (lower.includes("/docs/")) return true;
  if (lower.includes("/doc/")) return true;
  if (/readme(\.[^/]+)?$/i.test(lower)) return true;
  if (/\.(md|mdx|adoc|rst|txt)$/i.test(lower)) return true;

  // Examples/sample paths & .env samples
  if (/\.env\.example$/i.test(lower)) return true;
  if (/(^|\/)(example|examples|sample|samples)\//i.test(lower)) return true;

  // Treat scanner's own config & sources as docs to avoid self-noise
  if (/(^|\/)(tools|scripts)\/hardcoded-scan\.config\.json$/.test(lower)) return true;
  if (/(^|\/)(tools|scripts)\/hardcoded-scan(\.diff)?\.ts$/.test(lower)) return true;

  return false;
}
