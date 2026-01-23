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
      number, // Add direct number support for remapped fields
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

    // Map service types for consistency
    const serviceTypeMapping: Record<string, string> = {
      'ELECTRICITY': 'ELC',
      'POSTPAID': 'Postpaid',
      'GAS': 'Gas',
      'WATER': 'Water',
      'DTH': 'DTH',
      'BROADBAND': 'Broadband',
      'LANDLINE': 'Landline'
    };

    const mappedServiceType = serviceTypeMapping[service_type.toUpperCase()] || service_type;

    // Check if operator exists and is active in kwikapi_billers
    if (operator.service_type !== mappedServiceType) {
      return NextResponse.json(
        { success: false, message: `Service type mismatch. Expected ${mappedServiceType}, got ${operator.service_type}` },
        { status: 400 }
      );
    }

    if (!operator.is_active) {
      return NextResponse.json(
        { success: false, message: 'Operator not configured or inactive in admin settings' },
        { status: 400 }
      );
    }

    // Use default commission and cashback rates since we're using kwikapi_billers directly
    const commissionRate = 2.0; // Default 2% commission for retailers
    const cashbackEnabled = true; // Enable cashback for customers
    const cashbackMinPercentage = 0.5; // Default 0.5% minimum cashback
    const cashbackMaxPercentage = 2.0; // Default 2% maximum cashback

    // Calculate initial reward amount (will be randomized for customers if successful)
    let rewardAmount = 0;
    if (dbUser.role === 'CUSTOMER') {
      if (cashbackEnabled) {
        // Generate random cashback percentage between min and max
        const randomCashbackPercentage = (Math.random() * (cashbackMaxPercentage - cashbackMinPercentage) + cashbackMinPercentage);
        rewardAmount = (amount * randomCashbackPercentage) / 100;
      }
    } else {
      rewardAmount = (amount * commissionRate) / 100;
    }

    const rewardLabel = dbUser.role === 'CUSTOMER' ? 'Cashback' : 'Commission';
    const platformFee = 0;
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

    // Create transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('recharge_transactions')
      .insert({
        user_id: dbUser.id,
        operator_id: null, // Not using recharge_operators table anymore
        service_type: service_type.toUpperCase(),
        mobile_number,
        consumer_number,
        account_holder_name: customer_name || dbUser.name,
        amount,
        commission_amount: dbUser.role === 'CUSTOMER' ? 0 : rewardAmount,
        cashback_amount: dbUser.role === 'CUSTOMER' ? rewardAmount : 0,
        cashback_percentage: dbUser.role === 'CUSTOMER' && cashbackEnabled ? (rewardAmount / amount) * 100 : 0,
        platform_fee: platformFee,
        total_amount: totalAmount,
        status: 'PENDING',
        transaction_ref: transactionRef,
        bill_details: bill_details || {},
        dynamic_fields: { opt1, opt2, opt3, opt4, opt5, opt6, opt7, opt8, opt9, opt10 },
        kwikapi_provider: operator.operator_name,
      })
      .select()
      .single();

    if (txnError) {
      console.error('Transaction creation error:', txnError);
      return NextResponse.json(
        { success: false, message: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // NO UPFRONT DEDUCTION ANYMORE - Deduct only on SUCCESS (initial or callback)

    // Use the operator_id from the kwikapi_billers record
    const opid = operator.operator_id;

    console.log('💳 [BILL-PAYMENT] Processing payment:', {
      opid,
      amount,
      service_type,
      operator_name: operator.operator_name,
      kwikApiOrderId,
      kwikApiOrderIdLength: kwikApiOrderId.length
    });

    console.log('✅ [BILL-PAYMENT] Proceeding with payment...');

    // Process payment using KwikAPI
    let paymentResponse;

    console.log('🔍 [BILL-PAYMENT] Debug parameters:', {
      consumer_number,
      mobile_number,
      selected_number: consumer_number || mobile_number,
      opt1,
      ref_id,
      amount: parseFloat(amount),
      operator_name: operator.operator_name
    });

    // Note: ref_id validation removed as KwikAPI can work without it for some operators

    try {
      // Use utility bill payment API for all bills
      paymentResponse = await kwikapi.payUtilityBill({
        opid: parseInt(opid),
        number: number || consumer_number || mobile_number, // Use remapped number first, then consumer_number
        amount: parseFloat(amount), // Ensure amount is a number, not string
        order_id: kwikApiOrderId, // Use KwikAPI-compatible order ID
        mobile: mobile_number || dbUser.email,
        refrence_id: ref_id,
        opt1: opt1 || consumer_number || mobile_number, // Ensure opt1 has the consumer number
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

      // Map KwikAPI status to our status
      const responseStatus = (paymentResponse.data?.status || '').toUpperCase();
      let status: 'SUCCESS' | 'FAILED' | 'PENDING';

      // Map all possible KwikAPI status values
      if (responseStatus === 'SUCCESS') {
        status = 'SUCCESS';
      } else if (responseStatus === 'FAILURE' || responseStatus === 'FAILED') {
        status = 'FAILED';
      } else if (responseStatus === 'PENDING') {
        status = 'PENDING';
      } else {
        // Default to PENDING for unknown statuses (safer than FAILED)
        status = 'PENDING';
      }

      // Update transaction with KwikAPI response
      await supabase
        .from('recharge_transactions')
        .update({
          status,
          kwikapi_order_id: paymentResponse.data?.order_id,
          kwikapi_transaction_id: paymentResponse.data?.transaction_id,
          operator_transaction_id: paymentResponse.data?.opr_id,
          kwikapi_opr_id: paymentResponse.data?.opr_id,
          kwikapi_balance: paymentResponse.data?.balance,
          kwikapi_status: responseStatus,
          kwikapi_message: paymentResponse.data?.message,
          kwikapi_provider: paymentResponse.data?.provider,
          response_data: paymentResponse.data,
          completed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      // If successful OR pending with charged_amount > 0, deduct from wallet and add commission/cashback
      const chargedAmount = parseFloat(paymentResponse.data?.charged_amount || '0');
      const shouldProcessPayment = status === 'SUCCESS' || (status === 'PENDING' && chargedAmount > 0);

      if (shouldProcessPayment) {
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
          description: `Bill payment for ${service_type} ${consumer_number}`,
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
            description: `${rewardLabel} for ${service_type} bill payment`,
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

        if (status === 'SUCCESS') {
          return NextResponse.json({
            success: true,
            data: {
              transaction_id: transaction.id,
              transaction_ref: transactionRef,
              status: 'SUCCESS',
              amount,
              reward_amount: finalReward,
              reward_label: rewardLabel,
              message: `✅ Bill payment successful!`,
              kwikapi_status: responseStatus,
              operator_ref: paymentResponse.data?.opr_id,
              balance: paymentResponse.data?.balance,
            },
          });
        } else {
          // PENDING but processed (charged_amount > 0)
          return NextResponse.json({
            success: true,
            data: {
              transaction_id: transaction.id,
              transaction_ref: transactionRef,
              status: 'PENDING',
              amount,
              reward_amount: finalReward,
              reward_label: rewardLabel,
              message: `✅ ${paymentResponse.data?.message || paymentResponse.data?.operator_message || 'Bill payment submitted successfully! You will receive confirmation within 24 hours.'}`,
              kwikapi_status: responseStatus,
              operator_ref: paymentResponse.data?.opr_id,
              balance: paymentResponse.data?.balance,
            },
          });
        }
      } else if (status === 'PENDING') {
        return NextResponse.json({
          success: true,
          pending: true,
          data: {
            transaction_id: transaction.id,
            transaction_ref: transactionRef,
            status: 'PENDING',
            amount,
            message: `⏳ ${paymentResponse.data?.message || 'Your bill payment is being processed. You will receive confirmation within 24 hours.'}`,
            kwikapi_status: responseStatus,
            operator_ref: paymentResponse.data?.opr_id,
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
          success: true, // API call succeeded, but transaction failed
          data: {
            transaction_ref: transactionRef,
            status: 'FAILED',
            message: paymentResponse.data?.message || '❌ Bill payment failed. No amount was deducted.',
            kwikapi_status: responseStatus,
          },
        });
      }
    } catch (apiError: any) {
      console.error('Bill Payment API Error:', apiError);

      // API call failed - mark as pending for manual processing and provide user-friendly message
      // No deduction happened yet
      await supabase
        .from('recharge_transactions')
        .update({
          status: 'PENDING',
          error_message: apiError.message || 'API error - pending manual processing',
        })
        .eq('id', transaction.id);

      // Generate user-friendly error message
      let userFriendlyMessage = '⏳ Payment is being processed manually due to a technical issue. You will be notified once completed within 24 hours.';

      if (apiError.code === 'ENOTFOUND' || apiError.code === 'ECONNREFUSED') {
        userFriendlyMessage = '⚠️ Network connection issue. Your payment is being processed manually and will be completed within 24 hours.';
      } else if (apiError.code === 'ETIMEDOUT') {
        userFriendlyMessage = '⏳ Payment request timed out. Your payment is being processed and will be completed within 24 hours.';
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
    console.error('Bill Payment API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}