import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Get InsPay credentials from environment variables
    const username = env.INSPAY_USERNAME;
    const token = env.INSPAY_API_TOKEN;

    if (!username || !token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'InsPay credentials not configured. Please contact system administrator.' 
        },
        { status: 500 }
      );
    }

    // Call InsPay Balance API
    const balanceUrl = `https://www.connect.inspay.in/v3/recharge/balance?username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}&format=json`;
    
    const response = await fetch(balanceUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`InsPay API returned status ${response.status}`);
    }

    const data = await response.json();

    // Check if the API call was successful
    if (data.status === 'Success' && data.balance) {
      return NextResponse.json({
        success: true,
        data: {
          balance: parseFloat(data.balance),
          status: data.status,
          fetchedAt: new Date().toISOString(),
        },
        message: 'Balance fetched successfully',
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Failed to fetch balance from InsPay',
          data: data 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching InsPay balance:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch InsPay balance' 
      },
      { status: 500 }
    );
  }
}
