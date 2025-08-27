import { NextResponse, type NextRequest } from "next/server";

const PREVIEW_HOST_SUFFIXES = [".vercel.app", "localhost", "127.0.0.1"];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = url.hostname;

  // Only bypass preview/localhost environments
  // Let vercel.json handle all redirects to avoid conflicts
  if (PREVIEW_HOST_SUFFIXES.some(s => host.endsWith(s))) {
    return NextResponse.next();
  }
  
  // DISABLED: Let vercel.json handle www → apex redirects
  // if (host === "www.adminer.online") {
  //   url.hostname = "adminer.online";
  //   return NextResponse.redirect(url, 301);
  // }
  
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] }; 