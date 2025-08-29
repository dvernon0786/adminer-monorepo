import { NextRequest, NextResponse } from "next/server";

const ALLOW = [
  /^\/api\//,
  /^\/_next\//,
  /^\/assets\//,
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
];

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Bypass allowlist
  if (ALLOW.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // Only rewrite for HTML navigations
  const accept = req.headers.get("accept") || "";
  const isHTML = accept.includes("text/html") || accept.includes("*/*");
  if (isHTML) {
    const res = NextResponse.rewrite(new URL("/index.html", req.url));
    res.headers.set("x-mw", "spa-direct");
    res.headers.set("cache-control", "no-store");
    return res;
  }

  return NextResponse.next();
}

// Exclude files with extensions, let everything else run through middleware
export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
