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
    console.log('📥 [Bill Payment] Received request body:', {
      service_type: body.service_type,
      operator_code: body.operator_code,
      amount: body.amount,
      consumer_number: body.consumer_number,
      ref_id: body.ref_id,
      has_bill_details: !!body.bill_details
    });
    
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
      console.error('❌ [Bill Payment] Missing required fields:', {
        service_type: !!service_type,
        operator_code: !!operator_code,
        amount: !!amount,
        received_body: body
      });
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // CRITICAL FIX: For electricity bills, ensure we have a fresh ref_id
    let finalRefId = ref_id;
    let finalBillDetails = bill_details;
    let billFetchSessionId = null;

    if (service_type.toUpperCase() === 'ELECTRICITY' && consumer_number) {
      console.log('🔍 [Bill Payment] Checking for fresh ref_id for electricity payment...');
      
      // Look for the most recent valid bill fetch session
      const { data: billSession } = await supabase
        .from('bill_fetch_sessions')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('consumer_number', consumer_number)
        .eq('used_for_payment', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (billSession) {
        console.log('✅ [Bill Payment] Found valid bill fetch session:', {
          session_id: billSession.id,
          ref_id: billSession.ref_id,
          expires_at: billSession.expires_at
        });
        
        finalRefId = billSession.ref_id;
        finalBillDetails = billSession.bill_data;
        billFetchSessionId = billSession.id;
        
        // Mark session as used
        await supabase
          .from('bill_fetch_sessions')
          .update({ used_for_payment: true })
          .eq('id', billSession.id);
          
      } else if (ref_id) {
        console.warn('⚠️ [Bill Payment] No valid session found, but ref_id provided. This may cause payment failure.');
        console.warn('⚠️ [Bill Payment] Recommendation: Fetch fresh bill details before payment.');
      } else if (service_type.toUpperCase() === 'ELECTRICITY') {
        // CRITICAL FIX: If no ref_id for electricity, attempt fresh bill fetch
        console.log('🔄 [Bill Payment] No ref_id for electricity payment. Attempting fresh bill fetch...');
        
        try {
          // Attempt to fetch fresh bill details
          const billFetchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/kwikapi/bill-fetch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              opid: parseInt(operator_code),
              account_number: consumer_number,
              consumer_number: consumer_number,
              mobile_number: mobile_number,
              mobile: mobile_number,
              opt1: opt1,
              opt2: opt2,
              opt3: opt3,
              opt4: opt4,
              opt5: opt5,
            }),
          });

          const billFetchData = await billFetchResponse.json();
          
          if (billFetchData.success && billFetchData.data?.ref_id) {
            console.log('✅ [Bill Payment] Fresh bill fetch successful, using new ref_id:', billFetchData.data.ref_id);
            finalRefId = billFetchData.data.ref_id;
            finalBillDetails = billFetchData.data;
            
            // The bill fetch API will have created a new session, so let's get it
            const { data: newSession } = await supabase
              .from('bill_fetch_sessions')
              .select('id')
              .eq('user_id', dbUser.id)
              .eq('consumer_number', consumer_number)
              .eq('ref_id', finalRefId)
              .eq('used_for_payment', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            if (newSession) {
              billFetchSessionId = newSession.id;
              // Mark as used
              await supabase
                .from('bill_fetch_sessions')
                .update({ used_for_payment: true })
                .eq('id', newSession.id);
            }
          } else {
            console.warn('⚠️ [Bill Payment] Fresh bill fetch failed, proceeding without ref_id');
          }
        } catch (billFetchError) {
          console.error('❌ [Bill Payment] Fresh bill fetch error:', billFetchError);
          console.warn('⚠️ [Bill Payment] Proceeding without ref_id - payment may fail for BBPS operators');
        }
      } else {
        console.warn('⚠️ [Bill Payment] No ref_id available for electricity payment. Payment may fail for BBPS operators.');
      }
    }

    // Get operator details from recharge_operators table (contains admin-set commissions)
    const { data: operators } = await supabase
      .from('recharge_operators')
      .select('*')
      .eq('kwikapi_opid', parseInt(operator_code))
      .eq('service_type', service_type.toUpperCase())
      .eq('is_active', true)
      .limit(1);

    console.log('🔍 [BILL-PAYMENT] Operator lookup:', {
      operator_code: parseInt(operator_code),
      service_type: service_type.toUpperCase(),
      found_operators: operators?.length || 0,
      operators: operators
    });

    if (!operators || operators.length === 0) {
      console.error('❌ [Bill Payment] No active operator found:', {
        operator_code: parseInt(operator_code),
        service_type: service_type.toUpperCase(),
        searched_kwikapi_opid: parseInt(operator_code)
      });
      return NextResponse.json(
        { success: false, message: 'Invalid operator configuration' },
        { status: 400 }
      );
    }

    const operator = operators[0]; // Use the first active operator

    // Validate amount range
    const minAmt = parseFloat(operator.min_amount || '1');
    const maxAmt = parseFloat(operator.max_amount || '50000');

    if (amount < minAmt || amount > maxAmt) {
      console.error('❌ [Bill Payment] Amount validation failed:', {
        amount,
        minAmt,
        maxAmt,
        operator_name: operator.operator_name
      });
      return NextResponse.json(
        {
          success: false,
          message: `Amount must be between ₹${minAmt} and ₹${maxAmt}`,
        },
        { status: 400 }
      );
    }

    // Check if operator is active
    if (!operator.is_active) {
      console.error('❌ [Bill Payment] Operator not active:', {
        operator_id: operator.id,
        operator_name: operator.operator_name,
        is_active: operator.is_active
      });
      return NextResponse.json(
        { success: false, message: 'Operator not configured or inactive in admin settings' },
        { status: 400 }
      );
    }

    // Use admin-configured commission and cashback rates
    const commissionRate = parseFloat(operator.commission_rate || '0');
    const cashbackEnabled = operator.cashback_enabled;
    const cashbackMinPercentage = parseFloat(operator.cashback_min_percentage || '0');
    const cashbackMaxPercentage = parseFloat(operator.cashback_max_percentage || '0');

    // Calculate reward amount based on role and admin settings
    let rewardAmount = 0;
    if (dbUser.role === 'CUSTOMER') {
      if (cashbackEnabled) {
        // Generate random cashback percentage between min and max
        const range = cashbackMaxPercentage - cashbackMinPercentage;
        const randomCashbackPercentage = range > 0
          ? (Math.random() * range + cashbackMinPercentage)
          : cashbackMinPercentage;
        rewardAmount = (amount * randomCashbackPercentage) / 100;
      }
    } else {
      // For RETAILER/DISTRIBUTOR, use commission rate
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
      console.error('❌ [Bill Payment] Insufficient wallet balance:', {
        user_id: dbUser.id,
        wallet_balance: wallet?.balance || 0,
        required_amount: totalAmount,
        has_wallet: !!wallet
      });
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
        operator_id: operator.id, // Linking to recharge_operators table correctly
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
        bill_details: finalBillDetails || {},
        dynamic_fields: { opt1, opt2, opt3, opt4, opt5, opt6, opt7, opt8, opt9, opt10 },
        kwikapi_provider: operator.operator_name,
        bill_fetch_session_id: billFetchSessionId, // Link to bill fetch session
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

    // Use the kwikapi_opid from the recharge_operators record
    const opid = operator.kwikapi_opid;

    console.log('💳 [BILL-PAYMENT] Processing payment:', {
      opid,
      opid_type: typeof opid,
      opid_valid: !isNaN(opid),
      amount,
      service_type,
      operator_name: operator.operator_name,
      kwikApiOrderId,
      kwikApiOrderIdLength: kwikApiOrderId.length
    });

    console.log('✅ [BILL-PAYMENT] Proceeding with payment...');

    // Validate opid before making API call
    if (!opid || isNaN(opid)) {
      console.error('❌ [BILL-PAYMENT] Invalid operator ID:', {
        opid,
        opid_type: typeof opid,
        operator_name: operator.operator_name,
        operator_kwikapi_opid: operator.kwikapi_opid
      });
      return NextResponse.json(
        { success: false, message: 'Invalid operator configuration - missing operator ID' },
        { status: 400 }
      );
    }

    // Process payment using KwikAPI
    let paymentResponse;

    console.log('🔍 [BILL-PAYMENT] Debug parameters:', {
      consumer_number,
      mobile_number,
      selected_number: consumer_number || mobile_number,
      opt1,
      ref_id: finalRefId, // Use the fresh ref_id
      amount: parseFloat(amount),
      operator_name: operator.operator_name,
      bill_fetch_session_id: billFetchSessionId
    });

    // Note: ref_id validation removed as KwikAPI can work without it for some operators

    try {
      // Use utility bill payment API for all bills
      paymentResponse = await kwikapi.payUtilityBill({
        opid: opid, // opid is already a number from database
        number: number || consumer_number || mobile_number, // Use remapped number first, then consumer_number
        amount: parseFloat(amount), // Ensure amount is a number, not string
        order_id: kwikApiOrderId, // Use KwikAPI-compatible order ID
        mobile: mobile_number || dbUser.email,
        refrence_id: finalRefId, // Use the fresh ref_id from session
        opt1: opt1,
        opt2: opt2,
        opt3: opt3,
        opt4: opt4,
        opt5: opt5,
        opt6: opt6,
        opt7: opt7,
        opt8: opt8 || 'Billls',
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
              message: `✅ ${paymentResponse.data?.operator_message || paymentResponse.data?.message || 'Bill payment submitted successfully!'}`,
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