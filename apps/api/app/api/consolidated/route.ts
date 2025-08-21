import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  if (action === 'health') {
    return NextResponse.json({ status: 'healthy' });
  }
  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
} 