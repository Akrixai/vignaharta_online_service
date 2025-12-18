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
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with wallet
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, role, name, email')
      .eq('email', user.email)
      .single();

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      service_type, // 'POSTPAID' or 'ELECTRICITY' or 'GAS' or 'WATER'
      operator_code,
      mobile_number,
      consumer_number,
      amount,
      customer_name,
      ref_id, // From bill fetch for postpaid/electricity - IMPORTANT!
      bill_details, // Store complete bill details
      opt1,
      opt2,
      opt3,
      opt4,
      opt5,
      opt6,
      opt7,
      opt8,
      opt9,
      opt10,
    } = body;

    // Validate inputs
    if (!service_type || !operator_code || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get operator details from kwikapi_billers table
    const { data: operator } = await supabase
      .from('kwikapi_billers')
      .select('*')
      .eq('operator_id', parseInt(operator_code))
      .single();

    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Invalid operator' },
        { status: 400 }
      );
    }

    // Validate amount range
    if (amount < operator.amount_minimum || amount > operator.amount_maximum) {
      return NextResponse.json(
        {
          success: false,
          message: `Amount must be between ₹${operator.amount_minimum} and ₹${operator.amount_maximum}`,
        },
        { status: 400 }
      );
    }

    // Calculate commission/cashback based on user role
    const rewardRate = 2.0; // Default 2% - can be made configurable later
    const rewardAmount = (amount * rewardRate) / 100;
    const rewardLabel = dbUser.role === 'CUSTOMER' ? 'Cashback' : 'Commission';

    const platformFee = 0; // No platform fee
    const totalAmount = amount;

    // Check user wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', dbUser.id)
      .single();

    if (!wallet || wallet.balance < totalAmount) {
      return NextResponse.json(
        { success: false, message: 'Insufficient wallet balance' },
        { status: 402 }
      );
    }

    // Generate unique transaction reference
    const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('recharge_transactions')
      .insert({
        user_id: dbUser.id,
        operator_id: operator.id,
        service_type: service_type.toUpperCase(),
        mobile_number,
        consumer_number,
        account_holder_name: customer_name || dbUser.name,
        amount,
        commission_amount: rewardAmount,
        platform_fee: platformFee,
        total_amount: totalAmount,
        status: 'PENDING',
        transaction_ref: transactionRef,
        bill_details: bill_details ? JSON.stringify(bill_details) : null,
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // Deduct from wallet immediately
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance - totalAmount })
      .eq('user_id', dbUser.id);

    // Record wallet transaction (deduction)
    await supabase.from('transactions').insert({
      user_id: dbUser.id,
      wallet_id: wallet.id,
      type: 'WITHDRAWAL',
      amount: totalAmount,
      status: 'COMPLETED',
      description: `${service_type} Bill Payment ${mobile_number || consumer_number}`,
      reference: transactionRef,
      metadata: { recharge_transaction_id: transaction.id },
    });

    // Use the operator_id from the kwikapi_billers record
    const opid = operator.operator_id;

    // Check KWIKAPI wallet balance first
    const walletBalanceResponse = await kwikapi.getWalletBalance();
    const kwikApiBalance = parseFloat(walletBalanceResponse.data?.balance || '0');

    if (kwikApiBalance < amount) {
      // Insufficient KWIKAPI balance - mark as pending and notify admin
      await supabase
        .from('recharge_transactions')
        .update({
          status: 'PENDING',
          error_message: 'Insufficient KWIKAPI wallet balance. Transaction is being processed.',
          response_data: { kwikapi_balance: kwikApiBalance, required: amount },
        })
        .eq('id', transaction.id);

      return NextResponse.json({
        success: true, // Still success from user perspective
        pending: true,
        data: {
          transaction_id: transaction.id,
          transaction_ref: transactionRef,
          status: 'PENDING',
          amount,
          message: '⏳ Your transaction is being processed. Amount has been debited from your wallet. You will receive confirmation shortly. Please contact admin if not completed within 24 hours.',
        },
      });
    }

    // Process bill payment with KWIKAPI
    let paymentResponse;

    try {
      // Use utility bill payment API for all bill payments
      paymentResponse = await kwikapi.payUtilityBill({
        opid: parseInt(opid),
        number: mobile_number || consumer_number!,
        amount,
        order_id: transactionRef,
        mobile: mobile_number || dbUser.email,
        refrence_id: ref_id, // CRITICAL: ref_id from bill fetch response (note: typo in KWIKAPI)
        opt1: opt1,
        opt2: opt2,
        opt3: opt3,
        opt4: opt4,
        opt5: opt5,
        opt6: opt6,
        opt7: opt7,
        opt8: opt8 || 'Bills',
        opt9: opt9,
        opt10: opt10,
      });

      // Determine status from response
      const responseStatus = paymentResponse.data?.status || paymentResponse.data?.STATUS;
      let status: 'SUCCESS' | 'PENDING' | 'FAILED' = 'PENDING';

      if (responseStatus === 'SUCCESS') {
        status = 'SUCCESS';
      } else if (responseStatus === 'FAILED') {
        status = 'FAILED';
      }

      // Update transaction with response
      await supabase
        .from('recharge_transactions')
        .update({
          status,
          kwikapi_transaction_id: paymentResponse.data?.order_id,
          operator_transaction_id: paymentResponse.data?.opr_id,
          response_data: paymentResponse.data,
          completed_at: status === 'SUCCESS' ? new Date().toISOString() : null,
        })
        .eq('id', transaction.id);

      // Calculate cashback for customers (random between min and max)
      let actualCashback = 0;
      if (dbUser.role === 'CUSTOMER' && status === 'SUCCESS') {
        const minCashback = 0.5;
        const maxCashback = 2.0;
        const randomCashbackPercentage = (Math.random() * (maxCashback - minCashback) + minCashback).toFixed(2);
        actualCashback = (amount * parseFloat(randomCashbackPercentage)) / 100;

        // Update transaction with cashback info
        await supabase
          .from('recharge_transactions')
          .update({
            cashback_percentage: parseFloat(randomCashbackPercentage),
            cashback_amount: actualCashback,
          })
          .eq('id', transaction.id);
      }

      // If successful, add commission/cashback to user wallet
      if (status === 'SUCCESS') {
        const finalReward = dbUser.role === 'CUSTOMER' ? actualCashback : rewardAmount;

        if (finalReward > 0) {
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance - totalAmount + finalReward })
            .eq('user_id', dbUser.id);

          await supabase.from('transactions').insert({
            user_id: dbUser.id,
            wallet_id: wallet.id,
            type: dbUser.role === 'CUSTOMER' ? 'REFUND' : 'COMMISSION',
            amount: finalReward,
            status: 'COMPLETED',
            description: `${rewardLabel} for ${service_type} Bill Payment ${mobile_number || consumer_number}`,
            reference: transactionRef,
          });

          // Mark as claimed
          await supabase
            .from('recharge_transactions')
            .update({
              [dbUser.role === 'CUSTOMER' ? 'cashback_claimed' : 'commission_paid']: true,
              [dbUser.role === 'CUSTOMER' ? 'cashback_claimed_at' : 'commission_paid_at']: new Date().toISOString(),
            })
            .eq('id', transaction.id);
        }

        return NextResponse.json({
          success: true,
          data: {
            transaction_id: transaction.id,
            transaction_ref: transactionRef,
            status: 'SUCCESS',
            amount,
            reward_amount: finalReward,
            reward_label: rewardLabel,
            message: `✅ Bill payment successful! ${rewardLabel} of ₹${finalReward.toFixed(2)} has been added to your wallet.`,
            response: paymentResponse.data,
          },
        });
      } else if (status === 'PENDING') {
        return NextResponse.json({
          success: true,
          pending: true,
          data: {
            transaction_id: transaction.id,
            transaction_ref: transactionRef,
            status: 'PENDING',
            amount,
            message: '⏳ Your bill payment is being processed. Amount has been debited from your wallet. You will receive confirmation shortly. Please contact admin if not completed within 24 hours.',
          },
        });
      } else {
        // Failed - refund
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance })
          .eq('user_id', dbUser.id);

        await supabase.from('transactions').insert({
          user_id: dbUser.id,
          wallet_id: wallet.id,
          type: 'REFUND',
          amount: totalAmount,
          status: 'COMPLETED',
          description: `Refund for failed ${service_type} Bill Payment`,
          reference: transactionRef,
        });

        return NextResponse.json({
          success: false,
          data: {
            transaction_id: transaction.id,
            transaction_ref: transactionRef,
            status: 'FAILED',
            message: `❌ Bill payment failed. ${paymentResponse.data?.message || 'Unknown error'}. Amount has been refunded to your wallet.`,
          },
        });
      }
    } catch (apiError: any) {
      // API call failed - mark as pending instead of failed
      await supabase
        .from('recharge_transactions')
        .update({
          status: 'PENDING',
          error_message: apiError.message || 'API error - transaction pending',
          response_data: apiError.response?.data || {},
        })
        .eq('id', transaction.id);

      return NextResponse.json({
        success: true,
        pending: true,
        data: {
          transaction_id: transaction.id,
          transaction_ref: transactionRef,
          status: 'PENDING',
          amount,
          message: '⏳ Your bill payment is being processed. Amount has been debited from your wallet. You will receive confirmation shortly. Please contact admin if not completed within 24 hours.',
        },
      });
    }
  } catch (error: any) {
    console.error('Bill Payment API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}