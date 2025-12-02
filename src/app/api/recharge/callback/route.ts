import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transaction_id,
      operator_txn_id,
      status,
      amount,
      service,
    } = body;

    // Find transaction by KWIKAPI transaction ID
    const { data: transaction } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name)')
      .eq('kwikapi_transaction_id', transaction_id)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction status
    await supabase
      .from('recharge_transactions')
      .update({
        status: status.toUpperCase(),
        operator_transaction_id: operator_txn_id,
        callback_received: true,
        callback_data: body,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    // If status changed to SUCCESS and commission not yet credited
    if (status === 'SUCCESS' && transaction.status !== 'SUCCESS') {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', transaction.user_id)
        .single();

      if (wallet && transaction.commission_amount > 0) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + transaction.commission_amount })
          .eq('user_id', transaction.user_id);

        await supabase.from('transactions').insert({
          user_id: transaction.user_id,
          wallet_id: wallet.id,
          type: 'COMMISSION',
          amount: transaction.commission_amount,
          status: 'COMPLETED',
          description: `Commission for ${transaction.service_type} recharge`,
          reference: transaction.transaction_ref,
        });
      }
    }

    // If status changed to FAILED, issue refund
    if (status === 'FAILED' && transaction.status !== 'FAILED') {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', transaction.user_id)
        .single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + transaction.total_amount })
          .eq('user_id', transaction.user_id);

        await supabase.from('transactions').insert({
          user_id: transaction.user_id,
          wallet_id: wallet.id,
          type: 'REFUND',
          amount: transaction.total_amount,
          status: 'COMPLETED',
          description: `Refund for failed ${transaction.service_type} recharge`,
          reference: transaction.transaction_ref,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Recharge Callback API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
