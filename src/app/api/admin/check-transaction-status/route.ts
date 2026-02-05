import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { transaction_id } = await request.json();

    if (!transaction_id) {
      return NextResponse.json(
        { success: false, message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Get transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name, role)')
      .eq('id', transaction_id)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      );
    }

    let kwikApiStatus = null;
    let kwikApiResponse = null;
    let statusCheckError = null;

    // Check status with KwikAPI if we have an order ID
    const orderIdToCheck = transaction.kwikapi_order_id || transaction.transaction_ref;
    
    if (orderIdToCheck) {
      try {
        console.log('🔍 Checking KwikAPI status for order:', orderIdToCheck);
        const statusResponse = await kwikapi.getTransactionStatus(orderIdToCheck);
        kwikApiStatus = statusResponse.data?.status || statusResponse.data?.STATUS;
        kwikApiResponse = statusResponse.data;
        console.log('📦 KwikAPI Status Response:', statusResponse);
      } catch (error: any) {
        console.error('❌ KwikAPI Status Check Error:', error);
        statusCheckError = error.message;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction: {
          id: transaction.id,
          transaction_ref: transaction.transaction_ref,
          kwikapi_order_id: transaction.kwikapi_order_id,
          amount: transaction.amount,
          service_type: transaction.service_type,
          mobile_number: transaction.mobile_number,
          user_name: transaction.user.name,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
        },
        status_comparison: {
          local_status: transaction.status,
          callback_received: transaction.callback_received,
          kwikapi_status: kwikApiStatus,
          status_match: transaction.status?.toUpperCase() === kwikApiStatus?.toUpperCase(),
        },
        kwikapi_response: kwikApiResponse,
        status_check_error: statusCheckError,
        needs_recovery: (
          transaction.status === 'PENDING' && 
          !transaction.callback_received && 
          kwikApiStatus === 'SUCCESS'
        ),
      }
    });
  } catch (error: any) {
    console.error('Admin Transaction Status Check Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to list pending transactions that might need recovery
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get pending transactions from last 7 days
    const { data: pendingTransactions, error } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name, role)')
      .eq('status', 'PENDING')
      .eq('callback_received', false)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        pending_transactions: pendingTransactions?.map(tx => ({
          id: tx.id,
          transaction_ref: tx.transaction_ref,
          kwikapi_order_id: tx.kwikapi_order_id,
          amount: tx.amount,
          service_type: tx.service_type,
          mobile_number: tx.mobile_number,
          user_name: tx.user.name,
          created_at: tx.created_at,
          hours_pending: Math.floor((Date.now() - new Date(tx.created_at).getTime()) / (1000 * 60 * 60)),
        })) || [],
        total_count: pendingTransactions?.length || 0,
      }
    });
  } catch (error: any) {
    console.error('Admin Pending Transactions List Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}