import { NextRequest, NextResponse } from 'next/server';
import kwikapi from '@/lib/kwikapi';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [Test KWIKAPI] Testing wallet balance API...');
    
    // Test basic connectivity with wallet balance API
    const walletResponse = await kwikapi.getWalletBalance();
    
    console.log('🧪 [Test KWIKAPI] Wallet response:', walletResponse);
    
    if (walletResponse.success) {
      return NextResponse.json({
        success: true,
        message: 'KWIKAPI connection successful',
        wallet_balance: walletResponse.data?.balance || 'N/A',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'KWIKAPI connection failed',
        error: walletResponse.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('🧪 [Test KWIKAPI] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'KWIKAPI test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}