import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
      .select('id, role, name')
      .eq('email', user.email)
      .single();

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { transaction_id, new_status, reason } = await request.json();

    if (!transaction_id || !new_status) {
      return NextResponse.json(
        { success: false, message: 'Transaction ID and new status are required' },
        { status: 400 }
      );
    }

    if (!['SUCCESS', 'FAILED'].includes(new_status)) {
      return NextResponse.json(
        { success: false, message: 'Status must be SUCCESS or FAILED' },
        { status: 400 }
      );
    }

    console.log('🔄 Admin recovery initiated:', {
      transaction_id,
      new_status,
      admin: dbUser.name,
      reason
    });

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

    // Check if already processed
    if (transaction.status === new_status && transaction.callback_received) {
      return NextResponse.json(
        { success: false, message: `Transaction already processed with status: ${new_status}` },
        { status: 400 }
      );
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('recharge_transactions')
      .update({
        status: new_status,
        callback_received: true,
        callback_data: { 
          manual_recovery: true, 
          recovered_at: new Date().toISOString(),
          recovered_by: dbUser.id,
          admin_name: dbUser.name,
          recovery_reason: reason || 'Manual admin recovery'
        },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update transaction status' },
        { status: 500 }
      );
    }

    let settlementResult = null;

    // Process settlement if SUCCESS
    if (new_status === 'SUCCESS') {
      console.log('💰 Processing settlement for SUCCESS recovery...');
      settlementResult = await processTransactionSuccess(transaction, dbUser.id);
    }

    // Log the recovery action
    await supabase.from('admin_actions').insert({
      admin_id: dbUser.id,
      action_type: 'TRANSACTION_RECOVERY',
      target_id: transaction.id,
      details: {
        transaction_ref: transaction.transaction_ref,
        old_status: transaction.status,
        new_status: new_status,
        reason: reason,
        settlement_result: settlementResult
      },
      created_at: new Date().toISOString()
    });

    console.log('✅ Transaction recovered successfully:', {
      id: transaction.id,
      ref: transaction.transaction_ref,
      status: new_status
    });

    return NextResponse.json({
      success: true,
      message: `Transaction ${new_status === 'SUCCESS' ? 'recovered and settled' : 'marked as failed'} successfully`,
      data: {
        transaction_id: transaction.id,
        transaction_ref: transaction.transaction_ref,
        old_status: transaction.status,
        new_status: new_status,
        settlement_result: settlementResult,
        recovered_by: dbUser.name,
        recovered_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('❌ Admin Transaction Recovery Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processTransactionSuccess(transaction: any, adminId: string) {
  try {
    const user = transaction.user;
    if (!user) {
      throw new Error('User not found for transaction');
    }

    // Get current wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', transaction.user_id)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet not found');
    }

    // Get operator configuration
    const { data: rechargeOperator } = await supabase
      .from('recharge_operators')
      .select('*')
      .eq('id', transaction.operator_id)
      .single();

    const amountToDeduct = parseFloat(transaction.amount);
    let rewardAmount = 0;
    let rewardType = '';
    let rewardDescription = '';

    // Calculate reward
    if (user.role === 'CUSTOMER') {
      if (rechargeOperator?.cashback_enabled && !transaction.cashback_claimed) {
        const cashbackAmount = parseFloat(transaction.cashback_amount || 0);
        if (cashbackAmount > 0) {
          rewardAmount = cashbackAmount;
        } else {
          const minPercentage = parseFloat(rechargeOperator.cashback_min_percentage || 0.5);
          const maxPercentage = parseFloat(rechargeOperator.cashback_max_percentage || 2.0);
          const randomPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
          rewardAmount = (amountToDeduct * randomPercentage) / 100;

          await supabase
            .from('recharge_transactions')
            .update({
              cashback_percentage: randomPercentage,
              cashback_amount: rewardAmount,
            })
            .eq('id', transaction.id);
        }
        rewardType = 'REFUND';
        rewardDescription = `Cashback for ${transaction.service_type} recharge`;
      }
    } else {
      if (!transaction.commission_paid) {
        const commissionAmount = parseFloat(transaction.commission_amount || 0);
        if (commissionAmount > 0) {
          rewardAmount = commissionAmount;
        } else {
          const commissionRate = parseFloat(rechargeOperator?.commission_rate || 2.0);
          rewardAmount = (amountToDeduct * commissionRate) / 100;

          await supabase
            .from('recharge_transactions')
            .update({ commission_amount: rewardAmount })
            .eq('id', transaction.id);
        }
        rewardType = 'COMMISSION';
        rewardDescription = `Commission for ${transaction.service_type} recharge`;
      }
    }

    // Update wallet atomically: Deduct amount AND Add reward
    const finalBalanceChange = -amountToDeduct + rewardAmount;
    const newBalance = parseFloat(wallet.balance) + finalBalanceChange;

    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', transaction.user_id);

    if (walletUpdateError) {
      throw new Error('Failed to update wallet balance');
    }

    // Record transactions in ledger
    // Record Withdrawal
    const { error: withdrawalError } = await supabase.from('transactions').insert({
      user_id: transaction.user_id,
      wallet_id: wallet.id,
      type: 'WITHDRAWAL',
      amount: amountToDeduct,
      status: 'COMPLETED',
      description: `${transaction.service_type} Recharge ${transaction.mobile_number || transaction.dth_number || transaction.consumer_number}`,
      reference: transaction.transaction_ref,
      metadata: { 
        recharge_transaction_id: transaction.id, 
        manual_recovery: true,
        recovered_by_admin: adminId
      },
    });

    if (withdrawalError) {
      throw new Error('Failed to record withdrawal transaction');
    }

    // Record Reward if any
    if (rewardAmount > 0) {
      const { error: rewardError } = await supabase.from('transactions').insert({
        user_id: transaction.user_id,
        wallet_id: wallet.id,
        type: rewardType,
        amount: rewardAmount,
        status: 'COMPLETED',
        description: rewardDescription,
        reference: transaction.transaction_ref,
        metadata: { 
          recharge_transaction_id: transaction.id, 
          manual_recovery: true,
          recovered_by_admin: adminId
        },
      });

      if (rewardError) {
        throw new Error('Failed to record reward transaction');
      }

      // Mark reward as paid/claimed
      await supabase
        .from('recharge_transactions')
        .update({
          [user.role === 'CUSTOMER' ? 'cashback_claimed' : 'commission_paid']: true,
          [user.role === 'CUSTOMER' ? 'cashback_claimed_at' : 'commission_paid_at']: new Date().toISOString(),
        })
        .eq('id', transaction.id);
    }

    return {
      success: true,
      wallet_balance_before: parseFloat(wallet.balance),
      amount_deducted: amountToDeduct,
      reward_amount: rewardAmount,
      reward_type: rewardType,
      final_balance_change: finalBalanceChange,
      wallet_balance_after: newBalance
    };
  } catch (error: any) {
    console.error('❌ Settlement processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}