import { NextRequest, NextResponse } from "next/server";

// naive in-memory throttle (OK for hobby); replace with KV/DB if needed
let lastLog = 0;
const MIN_MS = 2000;

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    message: "CSP Report endpoint active", 
    timestamp: new Date().toISOString() 
  });
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  let payload: any = {};
  
  try {
    if (ct.includes("application/csp-report")) {
      // Some UAs wrap under { "csp-report": { ... } }
      const body = await req.json();
      payload = body["csp-report"] ?? body;
    } else {
      payload = await req.json();
      // Normalize common keys
      if (payload["csp-report"]) payload = payload["csp-report"];
    }
  } catch {
    // ignore parse errors
  }

  // minimal PII-safe log
  const entry = {
    ts: new Date().toISOString(),
    doc: payload["document-uri"],
    blocked: payload["blocked-uri"],
    directive: payload["violated-directive"],
    disposition: payload["disposition"],
    sample: payload["script-sample"],
  };

  const now = Date.now();
  if (now - lastLog > MIN_MS) {
    console.log("[CSP]", JSON.stringify(entry));
    lastLog = now;
  }

  return NextResponse.json({ ok: true, received: true });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 