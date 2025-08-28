import { NextResponse, NextRequest } from "next/server";

export const config = {
  // Simpler matcher - catch everything except API and Next.js internals
  matcher: [
    "/((?!api|_next).*)"
  ],
};

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  console.log(`[MIDDLEWARE] Processing: ${pathname}`);

  // Only handle GET/HEAD for SPA documents
  if (req.method !== "GET" && req.method !== "HEAD") {
    console.log(`[MIDDLEWARE] Skipping non-GET/HEAD: ${req.method}`);
    return NextResponse.next();
  }

  // Accept header should prefer HTML (avoid rewriting XHR/JSON)
  const accept = req.headers.get("accept") || "";
  const isHtml = accept.includes("text/html");

  if (!isHtml) {
    console.log(`[MIDDLEWARE] Skipping non-HTML accept: ${accept}`);
    return NextResponse.next();
  }

  // Rewrite anything that survives the matcher to index.html
  console.log(`[MIDDLEWARE] Rewriting ${pathname} to /index.html`);
  const url = req.nextUrl.clone();
  url.pathname = "/index.html";
  return NextResponse.rewrite(url);
}
