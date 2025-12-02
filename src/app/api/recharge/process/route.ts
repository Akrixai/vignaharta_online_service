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
    const rewardRate = operator.commission_rate;
    const rewardAmount = (amount * rewardRate) / 100;
    const rewardLabel = user.role === 'CUSTOMER' ? 'Cashback' : 'Commission';
    
    const platformFee = 2; // ₹2 platform fee
    const totalAmount = amount + platformFee;

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

    // Process recharge with KWIKAPI
    let rechargeResponse;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/callback`;

    try {
      switch (service_type.toUpperCase()) {
        case 'PREPAID':
          rechargeResponse = await kwikapi.rechargePrepaid({
            operator_code,
            mobile_number: mobile_number!,
            amount,
            circle_code: circle_code!,
            plan_id,
            transaction_ref: transactionRef,
            customer_name: customer_name || user.name,
            email: user.email,
            callback_url: callbackUrl,
          });
          break;

        case 'POSTPAID':
          rechargeResponse = await kwikapi.rechargePostpaid({
            operator_code,
            mobile_number: mobile_number!,
            amount,
            circle_code: circle_code!,
            transaction_ref: transactionRef,
            customer_name: customer_name || user.name,
            email: user.email,
          });
          break;

        case 'DTH':
          rechargeResponse = await kwikapi.rechargeDTH({
            operator_code,
            dth_number: dth_number!,
            amount,
            plan_id: plan_id!,
            transaction_ref: transactionRef,
            customer_name: customer_name || user.name,
            email: user.email,
          });
          break;

        case 'ELECTRICITY':
          rechargeResponse = await kwikapi.payElectricityBill({
            operator_code,
            consumer_number: consumer_number!,
            amount,
            circle_code: circle_code!,
            transaction_ref: transactionRef,
            customer_name: customer_name || user.name,
            email: user.email,
          });
          break;

        default:
          throw new Error('Invalid service type');
      }

      // Update transaction with response
      const status = rechargeResponse.data?.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING';
      
      await supabase
        .from('recharge_transactions')
        .update({
          status,
          kwikapi_transaction_id: rechargeResponse.data?.transaction_id,
          operator_transaction_id: rechargeResponse.data?.operator_txn_id,
          response_data: rechargeResponse.data,
          completed_at: status === 'SUCCESS' ? new Date().toISOString() : null,
        })
        .eq('id', transaction.id);

      // If successful, add commission/cashback to user wallet
      if (status === 'SUCCESS' && rewardAmount > 0) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance - totalAmount + rewardAmount })
          .eq('user_id', user.id);

        await supabase.from('transactions').insert({
          user_id: user.id,
          wallet_id: wallet.id,
          type: user.role === 'CUSTOMER' ? 'REFUND' : 'COMMISSION', // Use REFUND for cashback display
          amount: rewardAmount,
          status: 'COMPLETED',
          description: `${rewardLabel} for ${service_type} ${mobile_number || dth_number || consumer_number}`,
          reference: transactionRef,
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          transaction_id: transaction.id,
          transaction_ref: transactionRef,
          status,
          amount,
          reward_amount: rewardAmount,
          reward_label: rewardLabel,
          response: rechargeResponse.data,
        },
      });
    } catch (apiError: any) {
      // Recharge failed, refund to wallet
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance })
        .eq('user_id', user.id);

      await supabase
        .from('recharge_transactions')
        .update({
          status: 'FAILED',
          error_message: apiError.message || 'Recharge failed',
          response_data: apiError.response?.data || {},
        })
        .eq('id', transaction.id);

      // Refund transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: 'REFUND',
        amount: totalAmount,
        status: 'COMPLETED',
        description: `Refund for failed ${service_type}`,
        reference: transactionRef,
      });

      return NextResponse.json(
        {
          success: false,
          message: apiError.response?.data?.message || 'Recharge failed',
          error_code: apiError.response?.data?.error_code,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Recharge Process API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
