import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const from_date = searchParams.get('from_date');
    const to_date = searchParams.get('to_date');
    const service_type = searchParams.get('service_type');

    // Build KwikAPI URL
    const kwikApiKey = process.env.KWIKAPI_API_KEY;
    if (!kwikApiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'KWIKAPI_API_KEY not configured' 
      }, { status: 500 });
    }

    let apiUrl = `https://www.kwikapi.com/api/v2/transactions.php?api_key=${kwikApiKey}`;
    
    // Add optional parameters
    if (from_date) apiUrl += `&from_date=${from_date}`;
    if (to_date) apiUrl += `&to_date=${to_date}`;
    if (service_type) apiUrl += `&service_type=${service_type}`;

    console.log('🔍 [KwikAPI Transactions] Fetching from:', apiUrl.replace(kwikApiKey, '***'));

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VighnahartaOnlineService/1.0'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`KwikAPI responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📦 [KwikAPI Transactions] Response received:', {
      isArray: Array.isArray(data),
      count: Array.isArray(data) ? data.length : 'N/A',
      firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null
    });

    // Process and format the data
    const transactions = Array.isArray(data) ? data.map((transaction: any) => ({
      trx_id: transaction.trx_id,
      your_id: transaction.your_id,
      number: transaction.number,
      number2: transaction.number2,
      ref_id: transaction.ref_id,
      amount: parseFloat(transaction.amount || '0'),
      charged_amount: parseFloat(transaction.charged_amount || '0'),
      date: transaction.date,
      status: transaction.status,
      service: transaction.service,
      // Calculate profit/loss
      profit: parseFloat(transaction.amount || '0') - parseFloat(transaction.charged_amount || '0')
    })) : [];

    // Calculate summary statistics
    const summary = {
      total_transactions: transactions.length,
      total_amount: transactions.reduce((sum: number, t: any) => sum + t.amount, 0),
      total_charged: transactions.reduce((sum: number, t: any) => sum + t.charged_amount, 0),
      total_profit: transactions.reduce((sum: number, t: any) => sum + t.profit, 0),
      success_count: transactions.filter((t: any) => t.status === 'SUCCESS').length,
      failed_count: transactions.filter((t: any) => t.status === 'FAILED').length,
      pending_count: transactions.filter((t: any) => t.status === 'PENDING').length,
      reversal_count: transactions.filter((t: any) => t.status === 'REVERSAL').length,
      refunded_count: transactions.filter((t: any) => t.status === 'REFUNDED').length,
      credit_count: transactions.filter((t: any) => t.status === 'CREDIT').length
    };

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        summary,
        fetched_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ [KwikAPI Transactions] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch KwikAPI transactions'
    }, { status: 500 });
  }
}