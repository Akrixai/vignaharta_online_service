import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');
    const transaction_id = searchParams.get('transaction_id');

    if (!order_id && !transaction_id) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameter: order_id or transaction_id' },
        { status: 400 }
      );
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', authUser.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get local transaction with operator and circle details
    let query = supabase
      .from('recharge_transactions')
      .select(`
        *,
        operator:recharge_operators(operator_name, operator_code, logo_url),
        circle:recharge_circles(circle_name, circle_code)
      `)
      .eq('user_id', user.id);

    if (transaction_id) {
      query = query.eq('id', transaction_id);
    } else if (order_id) {
      query = query.eq('transaction_ref', order_id);
    }

    const { data: transaction, error: fetchError } = await query.single();

    if (fetchError || !transaction) {
      console.error('Transaction fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Transaction not found or you do not have permission to view it' },
        { status: 404 }
      );
    }

    // If transaction is already completed, return local data
    if (transaction.status === 'SUCCESS' || transaction.status === 'FAILED') {
      return NextResponse.json({
        success: true,
        data: transaction,
      });
    }

    // For pending transactions, check with KWIKAPI
    try {
      const statusResponse = await kwikapi.getTransactionStatus(transaction.transaction_ref);

      if (statusResponse.success) {
        const apiStatus = statusResponse.data.status || statusResponse.data.STATUS;
        const newStatus = apiStatus === 'SUCCESS' ? 'SUCCESS' :
          apiStatus === 'FAILED' ? 'FAILED' : 'PENDING';

        // Update local transaction
        await supabase
          .from('recharge_transactions')
          .update({
            status: newStatus,
            operator_transaction_id: statusResponse.data.operator_txn_id || statusResponse.data.txid,
            response_data: statusResponse.data,
            completed_at: newStatus !== 'PENDING' ? new Date().toISOString() : null,
          })
          .eq('id', transaction.id);

        // Fetch updated transaction with relations
        const { data: updatedTransaction } = await supabase
          .from('recharge_transactions')
          .select(`
            *,
            operator:recharge_operators(operator_name, operator_code, logo_url),
            circle:recharge_circles(circle_name, circle_code)
          `)
          .eq('id', transaction.id)
          .single();

        return NextResponse.json({
          success: true,
          data: updatedTransaction,
        });
      }
    } catch (apiError) {
      console.error('KWIKAPI Status Check Error:', apiError);
      // Return local data if API fails
    }

    // Return local transaction data
    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Transaction Status API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
