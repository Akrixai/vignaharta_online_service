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
        operator_id: null, // We'll use kwikapi_opid instead
        service_type: service_type.toUpperCase(),
        mobile_number,
        consumer_number,
        account_holder_name: customer_name || dbUser.name,
        amount,
        commission_amount: dbUser.role === 'CUSTOMER' ? 0 : rewardAmount,
        cashback_amount: dbUser.role === 'CUSTOMER' ? rewardAmount : 0,
        cashback_percentage: dbUser.role === 'CUSTOMER' ? rewardRate : 0,
        platform_fee: platformFee,
        total_amount: totalAmount,
        status: 'PENDING',
        transaction_ref: transactionRef,
        bill_details: bill_details || {},
        dynamic_fields: { opt1, opt2, opt3, opt4, opt5, opt6, opt7, opt8, opt9, opt10 },
        kwikapi_provider: operator.operator_name, // Store operator name for display
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

    // Deduct from wallet immediately
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance - totalAmount })
      .eq('user_id', dbUser.id);

    // Record wallet transaction
    await supabase.from('transactions').insert({
      user_id: dbUser.id,
      wallet_id: wallet.id,
      type: 'WITHDRAWAL',
      amount: totalAmount,
      status: 'COMPLETED',
      description: `Bill payment for ${service_type}`,
      reference_id: transactionRef,
      metadata: { recharge_transaction_id: transaction.id },
    });

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

    try {
      // Use utility bill payment API for all bills
      paymentResponse = await kwikapi.payUtilityBill({
        opid: parseInt(opid),
        number: mobile_number || consumer_number,
        amount,
        order_id: kwikApiOrderId, // Use KwikAPI-compatible order ID
        mobile: mobile_number || dbUser.email,
        refrence_id: ref_id,
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

      console.log('📦 [BILL-PAYMENT] KwikAPI Response:', paymentResponse);
      console.log('📦 [BILL-PAYMENT] KwikAPI Response Data:', JSON.stringify(paymentResponse.data, null, 2));
      console.log('📦 [BILL-PAYMENT] KwikAPI Response Status:', paymentResponse.data?.status);
      console.log('📦 [BILL-PAYMENT] KwikAPI Response Message:', paymentResponse.data?.message);

      // Map KwikAPI status to our status
      const responseStatus = (paymentResponse.data?.status || '').toUpperCase();
      let status: 'SUCCESS' | 'FAILED' | 'PENDING';

      // Map all possible KwikAPI status values
      if (responseStatus === 'SUCCESS') {
        status = 'SUCCESS';
      } else if (responseStatus === 'FAILURE' || responseStatus === 'FAILED') {
        status = 'FAILED';
      } else {
        // Default to PENDING for unknown statuses
        status = 'PENDING';
      }

      console.log(`📊 [BILL-PAYMENT] Status mapping: ${responseStatus} → ${status}`);

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

      // Calculate cashback for customers (random between min and max)
      let actualCashback = 0;
      if (dbUser.role === 'CUSTOMER' && status === 'SUCCESS') {
        const minCashback = 0.5;
        const maxCashback = 2.0;
        const randomCashbackPercentage = (Math.random() * (maxCashback - minCashback) + minCashback);
        actualCashback = (amount * randomCashbackPercentage) / 100;

        // Update transaction with actual cashback
        await supabase
          .from('recharge_transactions')
          .update({
            cashback_percentage: randomCashbackPercentage,
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
            type: dbUser.role === 'CUSTOMER' ? 'CASHBACK' : 'COMMISSION',
            amount: finalReward,
            status: 'COMPLETED',
            description: `${rewardLabel} for ${service_type} bill payment`,
            reference_id: transactionRef,
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
            message: `✅ Bill payment successful!`,
            kwikapi_status: responseStatus,
            operator_ref: paymentResponse.data?.opr_id,
            balance: paymentResponse.data?.balance,
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
            message: `⏳ ${paymentResponse.data?.message || 'Your bill payment is being processed. You will receive confirmation within 24 hours.'}`,
            kwikapi_status: responseStatus,
            operator_ref: paymentResponse.data?.opr_id,
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
          .eq('reference_id', transactionRef)
          .eq('type', 'WITHDRAWAL');

        return NextResponse.json({
          success: false,
          data: {
            transaction_ref: transactionRef,
            status: 'FAILED',
            message: paymentResponse.data?.message || '❌ Bill payment failed. Amount has been refunded to your wallet.',
            response: paymentResponse.data,
            technical_message: paymentResponse.data?.message,
          },
        });
      }
    } catch (apiError: any) {
      console.error('Bill Payment API Error:', apiError);

      // API call failed - mark as pending for manual processing and provide user-friendly message
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
      } else if (apiError.message?.includes('INSUFFICIENT BALANCE') || apiError.message?.includes('INSUFICIENT BALANCE')) {
        userFriendlyMessage = '⚠️ Service temporarily unavailable due to provider maintenance. Your payment will be processed within 24 hours.';
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