import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';
import { getServerSession } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with wallet
    const { data: user } = await supabase
      .from('users')
      .select('id, role, name, email')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      service_type,
      operator_code,
      circle_code,
      mobile_number,
      dth_number,
      consumer_number,
      amount,
      plan_id,
      customer_name,
      ref_id, // From bill fetch for postpaid/electricity - IMPORTANT!
      bill_details, // Store complete bill details
      opt1,
      opt2,
      opt3,
    } = body;

    // Validate inputs
    if (!service_type || !operator_code || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get operator details
    const { data: operator } = await supabase
      .from('recharge_operators')
      .select('*')
      .eq('operator_code', operator_code)
      .single();

    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Invalid operator' },
        { status: 400 }
      );
    }

    // Validate amount range
    if (amount < operator.min_amount || amount > operator.max_amount) {
      return NextResponse.json(
        {
          success: false,
          message: `Amount must be between ₹${operator.min_amount} and ₹${operator.max_amount}`,
        },
        { status: 400 }
      );
    }

    // Get circle if applicable
    let circleId = null;
    if (circle_code) {
      const { data: circle } = await supabase
        .from('recharge_circles')
        .select('id')
        .eq('circle_code', circle_code)
        .single();
      circleId = circle?.id;
    }

    // Calculate commission/cashback based on user role
    // RETAILER gets commission, CUSTOMER gets cashback
    // Note: Actual rates are NOT shown to users in UI
    const rewardRate = operator.commission_rate;
    const rewardAmount = (amount * rewardRate) / 100;
    const rewardLabel = user.role === 'CUSTOMER' ? 'Cashback' : 'Commission';
    
    const platformFee = 0; // No platform fee
    const totalAmount = amount;

    // Check user wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single();

    if (!wallet || wallet.balance < totalAmount) {
      return NextResponse.json(
        { success: false, message: 'Insufficient wallet balance' },
        { status: 402 }
      );
    }

    // Generate unique transaction reference
    const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('recharge_transactions')
      .insert({
        user_id: user.id,
        operator_id: operator.id,
        circle_id: circleId,
        service_type: service_type.toUpperCase(),
        mobile_number,
        dth_number,
        consumer_number,
        account_holder_name: customer_name || user.name,
        amount,
        commission_amount: rewardAmount,
        platform_fee: platformFee,
        total_amount: totalAmount,
        status: 'PENDING',
        transaction_ref: transactionRef,
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // Deduct from wallet
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance - totalAmount })
      .eq('user_id', user.id);

    // Record wallet transaction (deduction)
    await supabase.from('transactions').insert({
      user_id: user.id,
      wallet_id: wallet.id,
      type: 'WITHDRAWAL',
      amount: totalAmount,
      status: 'COMPLETED',
      description: `${service_type} ${mobile_number || dth_number || consumer_number}`,
      reference: transactionRef,
      metadata: { recharge_transaction_id: transaction.id },
    });

    // Get KWIKAPI operator ID (opid) from operator_code
    // You need to map your operator_code to KWIKAPI's opid
    // This should be stored in your recharge_operators table
    const { data: operatorMapping } = await supabase
      .from('recharge_operators')
      .select('metadata')
      .eq('operator_code', operator_code)
      .single();

    const opid = operatorMapping?.metadata?.kwikapi_opid || operator.id;

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

    // Process recharge with KWIKAPI
    let rechargeResponse;

    try {
      switch (service_type.toUpperCase()) {
        case 'PREPAID':
          rechargeResponse = await kwikapi.rechargePrepaid({
            opid: parseInt(opid),
            number: mobile_number!,
            amount,
            circle: circle_code,
            order_id: transactionRef,
            mobile: mobile_number!,
            opt1: plan_id,
          });
          break;

        case 'POSTPAID':
          rechargeResponse = await kwikapi.rechargePostpaid({
            opid: parseInt(opid),
            number: mobile_number!,
            amount,
            circle: circle_code,
            order_id: transactionRef,
            mobile: mobile_number!,
            ref_id: body.ref_id,
          });
          break;

        case 'DTH':
          rechargeResponse = await kwikapi.rechargeDTH({
            opid: parseInt(opid),
            number: dth_number!,
            amount,
            order_id: transactionRef,
            mobile: mobile_number || user.email,
            opt1: plan_id,
          });
          break;

        case 'ELECTRICITY':
        case 'GAS':
        case 'WATER':
          rechargeResponse = await kwikapi.payElectricityBill({
            opid: parseInt(opid),
            consumer_number: consumer_number!,
            amount,
            order_id: transactionRef,
            mobile: mobile_number || user.email,
            circle: circle_code,
            ref_id: body.ref_id,
            opt1: body.opt1,
            opt2: body.opt2,
            opt3: body.opt3,
          });
          break;

        default:
          throw new Error('Invalid service type');
      }

      // Determine status from response
      const responseStatus = rechargeResponse.data?.status || rechargeResponse.data?.STATUS;
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
          kwikapi_transaction_id: rechargeResponse.data?.transaction_id || rechargeResponse.data?.txid,
          operator_transaction_id: rechargeResponse.data?.operator_txn_id || rechargeResponse.data?.rrn,
          response_data: rechargeResponse.data,
          completed_at: status === 'SUCCESS' ? new Date().toISOString() : null,
        })
        .eq('id', transaction.id);

      // Calculate cashback for customers (random between min and max)
      let actualCashback = 0;
      if (user.role === 'CUSTOMER' && operator.cashback_enabled && status === 'SUCCESS') {
        const minCashback = operator.cashback_min_percentage || 0.5;
        const maxCashback = operator.cashback_max_percentage || 2.0;
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
        const finalReward = user.role === 'CUSTOMER' ? actualCashback : rewardAmount;
        
        if (finalReward > 0) {
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance - totalAmount + finalReward })
            .eq('user_id', user.id);

          await supabase.from('transactions').insert({
            user_id: user.id,
            wallet_id: wallet.id,
            type: user.role === 'CUSTOMER' ? 'REFUND' : 'COMMISSION',
            amount: finalReward,
            status: 'COMPLETED',
            description: `${rewardLabel} for ${service_type} ${mobile_number || dth_number || consumer_number}`,
            reference: transactionRef,
          });

          // Mark as claimed
          await supabase
            .from('recharge_transactions')
            .update({
              [user.role === 'CUSTOMER' ? 'cashback_claimed' : 'commission_paid']: true,
              [user.role === 'CUSTOMER' ? 'cashback_claimed_at' : 'commission_paid_at']: new Date().toISOString(),
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
            message: `✅ Recharge successful! ${rewardLabel} of ₹${finalReward.toFixed(2)} has been added to your wallet.`,
            response: rechargeResponse.data,
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
            message: '⏳ Your transaction is being processed. Amount has been debited from your wallet. You will receive confirmation shortly. Please contact admin if not completed within 24 hours.',
          },
        });
      } else {
        // Failed - refund
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance })
          .eq('user_id', user.id);

        await supabase.from('transactions').insert({
          user_id: user.id,
          wallet_id: wallet.id,
          type: 'REFUND',
          amount: totalAmount,
          status: 'COMPLETED',
          description: `Refund for failed ${service_type}`,
          reference: transactionRef,
        });

        return NextResponse.json({
          success: false,
          data: {
            transaction_id: transaction.id,
            transaction_ref: transactionRef,
            status: 'FAILED',
            message: '❌ Recharge failed. Amount has been refunded to your wallet.',
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
          message: '⏳ Your transaction is being processed. Amount has been debited from your wallet. You will receive confirmation shortly. Please contact admin if not completed within 24 hours.',
        },
      });
    }
  } catch (error: any) {
    console.error('Recharge Process API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
