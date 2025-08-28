import { NextResponse, type NextRequest } from "next/server";

const PREVIEW_HOST_SUFFIXES = [".vercel.app", "localhost", "127.0.0.1"];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = url.hostname;

  // Never touch preview/local
  if (PREVIEW_HOST_SUFFIXES.some(s => host.endsWith(s))) {
    return NextResponse.next();
  }

  // No redirects here—vercel.json handles www→apex safely.
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] }; 