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
      service_type,
      operator_code,
      circle_code,
      mobile_number,
      dth_number,
      subscriber_id,
      consumer_number,
      amount,
      plan_id,
      customer_name,
      ref_id,
      bill_details,
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

    // Get operator details from recharge_operators table (admin configured)
    const { data: operator } = await supabase
      .from('recharge_operators')
      .select('*')
      .eq('kwikapi_opid', parseInt(operator_code))
      .eq('service_type', service_type.toUpperCase())
      .eq('is_active', true)
      .single();

    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Invalid operator or operator not configured' },
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

    // Get circle if applicable (only for PREPAID)
    let circleId = null;
    if (circle_code && service_type.toUpperCase() === 'PREPAID') {
      const { data: circle } = await supabase
        .from('recharge_circles')
        .select('id')
        .eq('circle_code', circle_code)
        .single();
      circleId = circle?.id;
    }

    // Calculate commission/cashback based on user role and admin configuration
    let rewardAmount = 0;
    let rewardLabel = '';

    if (dbUser.role === 'CUSTOMER') {
      // Customer gets cashback only if enabled for this operator
      if (operator.cashback_enabled) {
        // Generate random cashback percentage between min and max
        const randomCashbackPercentage = (Math.random() * (operator.cashback_max_percentage - operator.cashback_min_percentage) + operator.cashback_min_percentage);
        rewardAmount = (amount * randomCashbackPercentage) / 100;
        rewardLabel = 'Cashback';
      }
    } else {
      // Retailer/Employee gets commission based on configured rate
      rewardAmount = (amount * operator.commission_rate) / 100;
      rewardLabel = 'Commission';
    }

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
        circle_id: circleId,
        service_type: service_type.toUpperCase(),
        mobile_number,
        dth_number: subscriber_id || dth_number,
        consumer_number,
        account_holder_name: customer_name || dbUser.name,
        amount,
        commission_amount: dbUser.role === 'CUSTOMER' ? 0 : rewardAmount,
        cashback_amount: dbUser.role === 'CUSTOMER' ? rewardAmount : 0,
        cashback_percentage: dbUser.role === 'CUSTOMER' && operator.cashback_enabled ? (rewardAmount / amount) * 100 : 0,
        platform_fee: platformFee,
        total_amount: totalAmount,
        status: 'PENDING',
        transaction_ref: transactionRef,
        bill_fetch_data: bill_details || {},
        dynamic_parameters: { opt1, opt2, opt3, ref_id },
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // Deduct from wallet
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
      description: `${service_type} ${mobile_number || subscriber_id || dth_number || consumer_number}`,
      reference: transactionRef,
      metadata: { recharge_transaction_id: transaction.id },
    });

    // Use the kwikapi_opid from the operator record
    const opid = operator.kwikapi_opid;

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
        success: true,
        pending: true,
        data: {
          transaction_id: transaction.id,
          transaction_ref: transactionRef,
          status: 'PENDING',
          amount,
          message: '⏳ Your transaction is being processed. Amount has been debited from your wallet. You will receive confirmation shortly.',
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
            state_code: circle_code,
            order_id: transactionRef,
            mobile: mobile_number!,
          });
          break;

        case 'POSTPAID':
          rechargeResponse = await kwikapi.payUtilityBill({
            opid: parseInt(opid),
            number: mobile_number!,
            amount,
            order_id: transactionRef,
            mobile: mobile_number!,
            refrence_id: ref_id,
          });
          break;

        case 'DTH':
          rechargeResponse = await kwikapi.rechargeDTH({
            opid: parseInt(opid),
            number: subscriber_id || dth_number!,
            amount,
            order_id: transactionRef,
            mobile: mobile_number || dbUser.email,
            opt1: plan_id,
          });
          break;

        case 'ELECTRICITY':
        case 'GAS':
        case 'WATER':
          rechargeResponse = await kwikapi.payUtilityBill({
            opid: parseInt(opid),
            number: consumer_number!,
            amount,
            order_id: transactionRef,
            mobile: mobile_number || dbUser.email,
            refrence_id: ref_id,
            opt1: opt1,
            opt2: opt2,
            opt3: opt3,
          });
          break;

        default:
          throw new Error('Invalid service type');
      }

      // Determine status from response - handle all possible status values
      const responseStatus = (rechargeResponse.data?.status || rechargeResponse.data?.STATUS || '').toUpperCase();
      let status: 'SUCCESS' | 'PENDING' | 'FAILED' = 'PENDING';

      // Map all possible status values from KWIKAPI
      if (responseStatus === 'SUCCESS') {
        status = 'SUCCESS';
      } else if (responseStatus === 'FAILED' || responseStatus === 'FAILURE') {
        status = 'FAILED';
      } else {
        // Default to PENDING for any other status (PENDING, PROCESSING, etc.)
        status = 'PENDING';
      }

      console.log(`📊 [RECHARGE] Status mapping: ${responseStatus} → ${status}`);

      // Update transaction with response
      await supabase
        .from('recharge_transactions')
        .update({
          status,
          kwikapi_order_id: rechargeResponse.data?.order_id || rechargeResponse.data?.txid,
          kwikapi_transaction_id: rechargeResponse.data?.transaction_id || rechargeResponse.data?.txid,
          operator_transaction_id: rechargeResponse.data?.operator_txn_id || rechargeResponse.data?.rrn,
          kwikapi_opr_id: rechargeResponse.data?.opr_id,
          kwikapi_balance: rechargeResponse.data?.balance,
          kwikapi_charged_amount: rechargeResponse.data?.charged_amount,
          kwikapi_message: rechargeResponse.data?.message,
          kwikapi_provider: rechargeResponse.data?.provider,
          response_data: rechargeResponse.data,
          completed_at: status === 'SUCCESS' ? new Date().toISOString() : null,
        })
        .eq('id', transaction.id);

      // If successful, add commission/cashback to user wallet immediately
      if (status === 'SUCCESS' && rewardAmount > 0) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance - totalAmount + rewardAmount })
          .eq('user_id', dbUser.id);

        await supabase.from('transactions').insert({
          user_id: dbUser.id,
          wallet_id: wallet.id,
          type: dbUser.role === 'CUSTOMER' ? 'REFUND' : 'COMMISSION',
          amount: rewardAmount,
          status: 'COMPLETED',
          description: `${rewardLabel} for ${service_type} ${mobile_number || subscriber_id || dth_number || consumer_number}`,
          reference: transactionRef,
        });

        // Mark as claimed/paid
        await supabase
          .from('recharge_transactions')
          .update({
            [dbUser.role === 'CUSTOMER' ? 'cashback_claimed' : 'commission_paid']: true,
            [dbUser.role === 'CUSTOMER' ? 'cashback_claimed_at' : 'commission_paid_at']: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        const successMessage = `✅ Recharge successful! ${rewardLabel} of ₹${rewardAmount.toFixed(2)} has been added to your wallet.`;

        return NextResponse.json({
          success: true,
          data: {
            transaction_id: transaction.id,
            transaction_ref: transactionRef,
            status: 'SUCCESS',
            amount,
            reward_amount: rewardAmount,
            reward_label: rewardLabel,
            message: successMessage,
            response: rechargeResponse.data,
            kwikapi_status: responseStatus, // Include original KWIKAPI status
            operator_ref: rechargeResponse.data?.opr_id,
            balance: rechargeResponse.data?.balance,
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
            message: '⏳ Your transaction is being processed. You will receive confirmation shortly.',
            response: rechargeResponse.data,
            kwikapi_status: responseStatus, // Include original KWIKAPI status
            operator_ref: rechargeResponse.data?.opr_id,
          },
        });
      } else {
        // Failed - do not store transaction and refund wallet
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance })
          .eq('user_id', dbUser.id);

        // Delete the recharge transaction record (do not store failed)
        await supabase
          .from('recharge_transactions')
          .delete()
          .eq('id', transaction.id);

        // Delete the withdrawal transaction record to keep wallet history clean
        await supabase
          .from('transactions')
          .delete()
          .eq('reference', transactionRef)
          .eq('type', 'WITHDRAWAL');

        return NextResponse.json({
          success: false,
          data: {
            transaction_ref: transactionRef,
            status: 'FAILED',
            message: `❌ Recharge failed. ${rechargeResponse.data?.message || 'Unknown error'}. Amount has been refunded to your wallet.`,
            response: rechargeResponse.data,
            kwikapi_status: responseStatus,
            operator_ref: rechargeResponse.data?.opr_id,
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
          message: '⏳ Your transaction is being processed. You will receive confirmation shortly.',
        },
      });
    }
  } catch (error: any) {
    console.error('Recharge Process V2 API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}