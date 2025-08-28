import { NextResponse, NextRequest } from "next/server";

export const config = {
  // Exclude _next, assets, api, and common static file types
  matcher: [
    "/((?!api|_next|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|css|js|map|txt|ico)).*)"
  ],
};

export default function middleware(req: NextRequest) {
  // Only handle GET/HEAD for SPA documents
  if (req.method !== "GET" && req.method !== "HEAD") return NextResponse.next();

  // Accept header should prefer HTML (avoid rewriting XHR/JSON)
  const accept = req.headers.get("accept") || "";
  const isHtml = accept.includes("text/html");

  if (!isHtml) return NextResponse.next();

  // Rewrite anything that survives the matcher to index.html (Vite build in public/)
  const url = req.nextUrl.clone();
  url.pathname = "/index.html";
  return NextResponse.rewrite(url);
}
