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
      opid, // KwikAPI operator ID
      number, // Mobile number or DTH subscriber ID
      amount,
      mobile, // Mobile number for notifications
      circle_code, // For prepaid mobile
      plan_details, // Selected plan details
    } = body;

    // Validate inputs
    if (!opid || !number || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: opid, number, amount' },
        { status: 400 }
      );
    }

    // Get operator details from recharge_operators table (this is the correct table for foreign key)
    const { data: rechargeOperator } = await supabase
      .from('recharge_operators')
      .select('*')
      .eq('kwikapi_opid', parseInt(opid))
      .eq('is_active', true)
      .single();

    if (!rechargeOperator) {
      return NextResponse.json(
        { success: false, message: 'Operator not configured or inactive' },
        { status: 400 }
      );
    }

    // Get operator details from kwikapi_billers table for validation
    const { data: operator } = await supabase
      .from('kwikapi_billers')
      .select('*')
      .eq('operator_id', parseInt(opid))
      .single();

    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Invalid operator in KwikAPI billers' },
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

    // Use admin-configured rates from recharge_operators table
    const commissionRate = rechargeOperator.commission_rate || 2.0;
    const cashbackEnabled = rechargeOperator.cashback_enabled || false;
    const cashbackMinPercentage = rechargeOperator.cashback_min_percentage || 0.5;
    const cashbackMaxPercentage = rechargeOperator.cashback_max_percentage || 2.0;

    // Calculate commission/cashback based on user role and admin configuration
    let rewardAmount = 0;
    const rewardLabel = dbUser.role === 'CUSTOMER' ? 'Cashback' : 'Commission';

    if (dbUser.role === 'CUSTOMER') {
      // Customer gets cashback only if enabled for this operator
      if (cashbackEnabled) {
        // Generate random cashback percentage between min and max
        const randomCashbackPercentage = (Math.random() * (cashbackMaxPercentage - cashbackMinPercentage) + cashbackMinPercentage);
        rewardAmount = (amount * randomCashbackPercentage) / 100;
      }
    } else {
      // Retailer/Employee gets commission based on configured rate
      rewardAmount = (amount * commissionRate) / 100;
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

    // Generate unique transaction reference for internal use
    const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Generate KwikAPI-compatible order ID (4-14 digits only)
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits of timestamp
    const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const kwikApiOrderId = timestamp + randomSuffix; // 14 digits total

    // Determine service type based on operator
    const serviceType = operator.service_type || 'PREPAID';

    // Get circle if applicable (only for PREPAID)
    let circleId = null;
    if (circle_code && serviceType.toUpperCase() === 'PREPAID') {
      const { data: circle } = await supabase
        .from('recharge_circles')
        .select('id')
        .eq('circle_code', circle_code)
        .single();
      circleId = circle?.id;
    }

    // Create transaction record using recharge_operators table ID
    const { data: transaction, error: txnError } = await supabase
      .from('recharge_transactions')
      .insert({
        user_id: dbUser.id,
        operator_id: rechargeOperator.id, // Use recharge_operators table ID
        circle_id: circleId,
        service_type: serviceType.toUpperCase(),
        mobile_number: serviceType === 'DTH' ? mobile : number,
        dth_number: serviceType === 'DTH' ? number : null,
        account_holder_name: dbUser.name,
        amount,
        commission_amount: dbUser.role === 'CUSTOMER' ? 0 : rewardAmount,
        cashback_amount: dbUser.role === 'CUSTOMER' ? rewardAmount : 0,
        cashback_percentage: dbUser.role === 'CUSTOMER' && cashbackEnabled ? (rewardAmount / amount) * 100 : 0,
        platform_fee: platformFee,
        total_amount: totalAmount,
        status: 'PENDING',
        transaction_ref: transactionRef,
        plan_details: plan_details ? JSON.stringify(plan_details) : null,
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // NO UPFRONT DEDUCTION ANYMORE - Deduct only on SUCCESS (initial or callback)

    console.log('✅ [RECHARGE] Proceeding with recharge...');

    // Process recharge with KWIKAPI
    let rechargeResponse;

    try {
      if (serviceType.toUpperCase() === 'DTH') {
        rechargeResponse = await kwikapi.rechargeDTH({
          opid: parseInt(opid),
          number: number,
          amount,
          order_id: kwikApiOrderId, // Use KwikAPI-compatible order ID
          mobile: mobile || dbUser.email,
        });
      } else {
        // PREPAID mobile recharge
        rechargeResponse = await kwikapi.rechargePrepaid({
          opid: parseInt(opid),
          number: number,
          amount,
          state_code: circle_code || '0',
          order_id: kwikApiOrderId, // Use KwikAPI-compatible order ID
          mobile: mobile || number,
        });
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
          kwikapi_transaction_id: rechargeResponse.data?.order_id,
          operator_transaction_id: rechargeResponse.data?.opr_id,
          response_data: rechargeResponse.data,
          completed_at: status === 'SUCCESS' ? new Date().toISOString() : null,
        })
        .eq('id', transaction.id);

      // If successful, deduct from wallet and add commission/cashback
      if (status === 'SUCCESS') {
        const finalReward = rewardAmount;

        // Perform settlement: Deduct amount AND Add reward
        const finalBalanceChange = -totalAmount + finalReward;

        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + finalBalanceChange })
          .eq('user_id', dbUser.id);

        // Record Withdrawal in ledger
        await supabase.from('transactions').insert({
          user_id: dbUser.id,
          wallet_id: wallet.id,
          type: 'WITHDRAWAL',
          amount: totalAmount,
          status: 'COMPLETED',
          description: `${serviceType} Recharge ${number}`,
          reference: transactionRef,
          metadata: { recharge_transaction_id: transaction.id },
        });

        if (finalReward > 0) {
          // Record Reward in ledger
          await supabase.from('transactions').insert({
            user_id: dbUser.id,
            wallet_id: wallet.id,
            type: dbUser.role === 'CUSTOMER' ? 'REFUND' : 'COMMISSION',
            amount: finalReward,
            status: 'COMPLETED',
            description: `${rewardLabel} for ${serviceType} Recharge ${number}`,
            reference: transactionRef,
            metadata: { recharge_transaction_id: transaction.id },
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
            message: `✅ ${rechargeResponse.data?.message || 'Recharge successful!'} ${finalReward > 0 ? `${rewardLabel} of ₹${finalReward.toFixed(2)} has been added to your wallet.` : ''}`,
            response: rechargeResponse.data,
            opr_id: rechargeResponse.data?.opr_id,
            balance: rechargeResponse.data?.balance,
            operator_ref: rechargeResponse.data?.opr_id,
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
            message: `⏳ ${rechargeResponse.data?.message || 'Your transaction is being processed. You will receive confirmation shortly. Please contact admin if not completed within 24 hours.'}`,
            response: rechargeResponse.data,
          },
        });
      } else {
        // Failed - do not store transaction and DO NOT deduct anything
        // Delete the recharge transaction record (do not store failed)
        await supabase
          .from('recharge_transactions')
          .delete()
          .eq('id', transaction.id);

        return NextResponse.json({
          success: false,
          data: {
            transaction_ref: transactionRef,
            status: 'FAILED',
            message: rechargeResponse.data?.message || '❌ Recharge failed. No amount was deducted.',
            response: rechargeResponse.data,
            technical_message: rechargeResponse.data?.message,
          },
        });
      }
    } catch (apiError: any) {
      console.error('Recharge API Error:', apiError);

      // API call failed - mark as pending instead of failed and provide user-friendly message
      // No deduction happened yet, so it stays pending
      await supabase
        .from('recharge_transactions')
        .update({
          status: 'PENDING',
          error_message: apiError.message || 'API error - transaction pending',
          response_data: apiError.response?.data || {},
        })
        .eq('id', transaction.id);

      // Generate user-friendly error message
      let userFriendlyMessage = '⏳ Recharge is being processed manually due to a technical issue. You will be notified once completed within 24 hours.';

      if (apiError.code === 'ENOTFOUND' || apiError.code === 'ECONNREFUSED') {
        userFriendlyMessage = '⚠️ Network connection issue. Your recharge is being processed manually and will be completed within 24 hours.';
      } else if (apiError.code === 'ETIMEDOUT') {
        userFriendlyMessage = '⏳ Recharge request timed out. Your recharge is being processed and will be completed within 24 hours.';
      }

      return NextResponse.json({
        success: true,
        pending: true,
        data: {
          transaction_id: transaction.id,
          transaction_ref: transactionRef,
          status: 'PENDING',
          amount,
          message: userFriendlyMessage,
        },
      });
    }
  } catch (error: any) {
    console.error('KwikAPI Recharge API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}