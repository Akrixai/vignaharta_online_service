import { NextResponse } from 'next/server';

export async function GET() {
  const appId = process.env.NEXT_PUBLIC_CHAPORT_APP_ID;
  
  return NextResponse.json({
    appId: appId || 'NOT_SET',
    hasAppId: !!appId,
  });
}
