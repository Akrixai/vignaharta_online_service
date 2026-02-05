#!/usr/bin/env node

/**
 * Script to recover transactions that were successful on KwikAPI
 * but missed the callback and remain PENDING in our system
 * 
 * Usage:
 *   node scripts/recover-missed-callback.js <transaction_id> [status]
 * 
 * Example:
 *   node scripts/recover-missed-callback.js cd137761-a21c-426a-aefd-7ce874b828cf SUCCESS
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function recoverTransaction(transactionId, newStatus = 'SUCCESS') {
  try {
    console.log('🔄 Starting transaction recovery...');
    console.log('Transaction ID:', transactionId);
    console.log('New Status:', newStatus);
    console.log('---');

    // Get transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name, role)')
      .eq('id', transactionId)
      .single();

    if (fetchError || !transaction) {
      console.error('❌ Transaction not found:', transactionId);
      console.error('Error:', fetchError);
      return;
    }

    console.log('📋 Transaction Details:');
    console.log('  Ref:', transaction.transaction_ref);
    console.log('  User:', transaction.user.name);
    console.log('  Amount:', `₹${transaction.amount}`);
    console.log('  Current Status:', transaction.status);
    console.log('  Service Type:', transaction.service_type);
    console.log('  Mobile/Number:', transaction.mobile_number || transaction.dth_number || transaction.consumer_number);
    console.log('---');

    // Check if already processed
    if (transaction.status === newStatus && transaction.callback_received) {
      console.log('⚠️  Transaction already processed with status:', newStatus);
      return;
    }

    // Update transaction status
    console.log('📝 Updating transaction status...');
    const { error: updateError } = await supabase
      .from('recharge_transactions')
      .update({
        status: newStatus,
        callback_received: true,
        callback_data: { 
          manual_recovery: true, 
          recovered_at: new Date().toISOString(),
          recovered_by: 'admin_script'
        },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError);
      return;
    }

    console.log('✅ Transaction status updated to:', newStatus);

    // Process settlement if SUCCESS
    if (newStatus === 'SUCCESS') {
      console.log('---');
      console.log('💰 Processing settlement...');
      await processTransactionSuccess(transaction);
    } else if (newStatus === 'FAILED') {
      console.log('---');
      console.log('🗑️  Transaction marked as FAILED - no settlement needed');
    }

    console.log('---');
    console.log('✅ Transaction recovered successfully!');
    console.log('Transaction ID:', transaction.id);
    console.log('Reference:', transaction.transaction_ref);
  } catch (error) {
    console.error('❌ Recovery failed:', error);
    throw error;
  }
}

async function processTransactionSuccess(transaction) {
  const user = transaction.user;
  if (!user) {
    console.error('❌ User not found for transaction');
    return;
  }

  // Get current wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', transaction.user_id)
    .single();

  if (walletError || !wallet) {
    console.error('❌ Wallet not found:', walletError);
    return;
  }

  console.log('  Current Wallet Balance:', `₹${wallet.balance}`);

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

  console.log('  Amount to Deduct:', `₹${amountToDeduct.toFixed(2)}`);
  console.log('  Reward Amount:', `₹${rewardAmount.toFixed(2)}`);
  console.log('  Reward Type:', rewardType || 'None');

  // Update wallet atomically: Deduct amount AND Add reward
  const finalBalanceChange = -amountToDeduct + rewardAmount;
  const newBalance = parseFloat(wallet.balance) + finalBalanceChange;

  console.log('  Final Balance Change:', `₹${finalBalanceChange.toFixed(2)}`);
  console.log('  New Wallet Balance:', `₹${newBalance.toFixed(2)}`);

  const { error: walletUpdateError } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('user_id', transaction.user_id);

  if (walletUpdateError) {
    console.error('❌ Failed to update wallet:', walletUpdateError);
    return;
  }

  console.log('✅ Wallet updated successfully');

  // Record transactions in ledger
  // Record Withdrawal
  console.log('  Recording withdrawal transaction...');
  const { error: withdrawalError } = await supabase.from('transactions').insert({
    user_id: transaction.user_id,
    wallet_id: wallet.id,
    type: 'WITHDRAWAL',
    amount: amountToDeduct,
    status: 'COMPLETED',
    description: `${transaction.service_type} Recharge ${transaction.mobile_number || transaction.dth_number || transaction.consumer_number}`,
    reference: transaction.transaction_ref,
    metadata: { recharge_transaction_id: transaction.id, manual_recovery: true },
  });

  if (withdrawalError) {
    console.error('❌ Failed to record withdrawal:', withdrawalError);
  } else {
    console.log('✅ Withdrawal recorded');
  }

  // Record Reward if any
  if (rewardAmount > 0) {
    console.log('  Recording reward transaction...');
    const { error: rewardError } = await supabase.from('transactions').insert({
      user_id: transaction.user_id,
      wallet_id: wallet.id,
      type: rewardType,
      amount: rewardAmount,
      status: 'COMPLETED',
      description: rewardDescription,
      reference: transaction.transaction_ref,
      metadata: { recharge_transaction_id: transaction.id, manual_recovery: true },
    });

    if (rewardError) {
      console.error('❌ Failed to record reward:', rewardError);
    } else {
      console.log('✅ Reward recorded');
    }

    // Mark reward as paid/claimed
    await supabase
      .from('recharge_transactions')
      .update({
        [user.role === 'CUSTOMER' ? 'cashback_claimed' : 'commission_paid']: true,
        [user.role === 'CUSTOMER' ? 'cashback_claimed_at' : 'commission_paid_at']: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    console.log('✅ Reward marked as claimed');
  }

  console.log('✅ Settlement completed successfully');
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/recover-missed-callback.js <transaction_id> [status]');
  console.error('Example: node scripts/recover-missed-callback.js cd137761-a21c-426a-aefd-7ce874b828cf SUCCESS');
  process.exit(1);
}

const transactionId = args[0];
const status = args[1] || 'SUCCESS';

recoverTransaction(transactionId, status)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
