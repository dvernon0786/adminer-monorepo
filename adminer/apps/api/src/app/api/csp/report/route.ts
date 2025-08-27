import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const violation = await req.json();
    
    // Log CSP violation for monitoring
    console.log('🚨 CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      documentUri: violation['document-uri'],
      blockedUri: violation['blocked-uri'],
      violatedDirective: violation['violated-directive'],
      originalPolicy: violation['original-policy'],
      userAgent: req.headers.get('user-agent'),
    });

    // Return 200 to acknowledge receipt
    return NextResponse.json({ 
      ok: true, 
      received: true,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error processing CSP report:', error);
    
    // Still return 200 to prevent browser retries
    return NextResponse.json({ 
      ok: false, 
      error: 'invalid_report',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
}

// Also handle GET for testing
export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    message: 'CSP Report endpoint active',
    timestamp: new Date().toISOString()
  }, { status: 200 });
} 