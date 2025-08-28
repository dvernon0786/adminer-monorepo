import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Exclude API, Next assets, all files with extensions, and favicon
export const config = {
  matcher: ["/((?!api|_next|.*\\..*|favicon.ico).*)"]
};

export default function middleware(_req: NextRequest) {
  // No redirects from middleware; keep it inert for now.
  return NextResponse.next();
} 