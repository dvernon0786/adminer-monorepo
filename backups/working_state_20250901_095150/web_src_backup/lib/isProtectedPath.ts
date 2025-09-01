export const PROTECTED_PREFIXES = ["/dashboard", "/jobs", "/settings", "/billing"];

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
} 