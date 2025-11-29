import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ isAuthenticated: false });
    }
    
    return NextResponse.json({ 
      isAuthenticated: true,
      user: session.user
    });
  } catch (error) {
    return NextResponse.json({ isAuthenticated: false });
  }
}
