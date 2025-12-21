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

        // Handle SUCCESS/FAILED status changes for Deduct on Success model
        if (newStatus === 'SUCCESS') {
          // Re-fetch with user context for settlement
          const { data: fullTransaction } = await supabase
            .from('recharge_transactions')
            .select('*, user:users(id, email, name, role)')
            .eq('id', transaction.id)
            .single();

          if (fullTransaction) {
            await processTransactionSuccess(fullTransaction);
          }
        } else if (newStatus === 'FAILED') {
          // Delete from history
          await supabase
            .from('recharge_transactions')
            .delete()
            .eq('id', transaction.id);

          return NextResponse.json({
            success: true,
            data: { ...transaction, status: 'FAILED' },
            message: 'Transaction failed and removed from history'
          });
        }

        // Fetch updated transaction with relations if not deleted
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
          data: updatedTransaction || { ...transaction, status: newStatus },
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

// Process successful transaction: Deduct money AND give rewards
async function processTransactionSuccess(transaction: any) {
  try {
    const user = transaction.user;
    if (!user) return;

    // 1. Get current wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', transaction.user_id)
      .single();

    if (!wallet) return;

    // 2. Get operator configuration for reward calculation
    const { data: rechargeOperator } = await supabase
      .from('recharge_operators')
      .select('*')
      .eq('id', transaction.operator_id)
      .single();

    const amountToDeduct = transaction.amount;
    let rewardAmount = 0;
    let rewardType = '';
    let rewardDescription = '';

    // 3. Calculate reward if not already set
    if (user.role === 'CUSTOMER') {
      if (rechargeOperator?.cashback_enabled && !transaction.cashback_claimed) {
        if (!transaction.cashback_amount || transaction.cashback_amount === 0) {
          const minPercentage = rechargeOperator.cashback_min_percentage || 0.5;
          const maxPercentage = rechargeOperator.cashback_max_percentage || 2.0;
          const randomPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
          rewardAmount = (transaction.amount * randomPercentage) / 100;

          await supabase
            .from('recharge_transactions')
            .update({
              cashback_percentage: randomPercentage,
              cashback_amount: rewardAmount,
            })
            .eq('id', transaction.id);
        } else {
          rewardAmount = transaction.cashback_amount;
        }
        rewardType = 'REFUND';
        rewardDescription = `Cashback for ${transaction.service_type} recharge`;
      }
    } else {
      if (!transaction.commission_paid) {
        if (!transaction.commission_amount || transaction.commission_amount === 0) {
          const commissionRate = rechargeOperator?.commission_rate || 2.0;
          rewardAmount = (transaction.amount * commissionRate) / 100;

          await supabase
            .from('recharge_transactions')
            .update({ commission_amount: rewardAmount })
            .eq('id', transaction.id);
        } else {
          rewardAmount = transaction.commission_amount;
        }
        rewardType = 'COMMISSION';
        rewardDescription = `Commission for ${transaction.service_type} recharge`;
      }
    }

    // 4. Update wallet atomically: Deduct amount AND Add reward
    const finalBalanceChange = -amountToDeduct + rewardAmount;

    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + finalBalanceChange })
      .eq('user_id', transaction.user_id);

    // 5. Record transactions in ledger
    // Record Withdrawal
    await supabase.from('transactions').insert({
      user_id: transaction.user_id,
      wallet_id: wallet.id,
      type: 'WITHDRAWAL',
      amount: amountToDeduct,
      status: 'COMPLETED',
      description: `${transaction.service_type} Recharge ${transaction.mobile_number || transaction.dth_number || transaction.consumer_number}`,
      reference: transaction.transaction_ref,
      metadata: { recharge_transaction_id: transaction.id },
    });

    // Record Reward if any
    if (rewardAmount > 0) {
      await supabase.from('transactions').insert({
        user_id: transaction.user_id,
        wallet_id: wallet.id,
        type: rewardType,
        amount: rewardAmount,
        status: 'COMPLETED',
        description: rewardDescription,
        reference: transaction.transaction_ref,
        metadata: { recharge_transaction_id: transaction.id },
      });

      // Mark reward as paid/claimed
      await supabase
        .from('recharge_transactions')
        .update({
          [user.role === 'CUSTOMER' ? 'cashback_claimed' : 'commission_paid']: true,
          [user.role === 'CUSTOMER' ? 'cashback_claimed_at' : 'commission_paid_at']: new Date().toISOString(),
        })
        .eq('id', transaction.id);
    }
    console.log(`✅ [StatusPoll] Settlement completed for ${transaction.id}`);
  } catch (error) {
    console.error('❌ [StatusPoll] Success settlement error:', error);
  }
}
