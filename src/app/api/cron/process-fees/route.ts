import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// This endpoint should be called by a cron job daily
// POST /api/cron/process-fees
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get all active fees
    const { data: fees, error: feesError } = await supabaseAdmin
      .from('registration_fees')
      .select('*')
      .in('fee_type', ['YEARLY_FEE_CUSTOMER', 'YEARLY_FEE_RETAILER', 'PLATFORM_FEE_CUSTOMER', 'PLATFORM_FEE_RETAILER'])
      .eq('is_active', true)
      .gt('amount', 0);

    if (feesError || !fees) {
      return NextResponse.json(
        { error: 'Failed to fetch fees' },
        { status: 500 }
      );
    }

    // Process each fee type
    for (const fee of fees) {
      const userType = fee.fee_type.includes('CUSTOMER') ? 'CUSTOMER' : 'RETAILER';
      
      // Get all users of this type
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, wallets(id, balance)')
        .eq('role', userType)
        .eq('is_active', true);

      if (usersError || !users) {
        results.errors.push(`Failed to fetch ${userType} users`);
        continue;
      }

      // Check each user's last payment
      for (const user of users) {
        try {
          const wallet = user.wallets?.[0];
          if (!wallet) continue;

          // Check if fee is due
          const { data: lastPayment } = await supabaseAdmin
            .from('user_fee_payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('fee_type', fee.fee_type)
            .order('payment_date', { ascending: false })
            .limit(1)
            .single();

          const now = new Date();
          let isDue = false;
          let nextDueDate = new Date();

          if (!lastPayment) {
            // First time payment - check if user created more than billing period ago
            const { data: userData } = await supabaseAdmin
              .from('users')
              .select('created_at')
              .eq('id', user.id)
              .single();

            if (userData) {
              const userCreated = new Date(userData.created_at);
              const monthsSinceCreation = (now.getTime() - userCreated.getTime()) / (1000 * 60 * 60 * 24 * 30);
              
              // Check based on billing period
              if (fee.fee_type.includes('YEARLY_FEE')) {
                isDue = monthsSinceCreation >= 12;
                nextDueDate = new Date(userCreated);
                nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
              } else {
                // Platform fee
                const periods: Record<string, number> = {
                  'MONTHLY': 1,
                  'QUARTERLY': 3,
                  'HALF_YEARLY': 6,
                  'YEARLY': 12,
                };
                const months = periods[fee.billing_period] || 12;
                isDue = monthsSinceCreation >= months;
                nextDueDate = new Date(userCreated);
                nextDueDate.setMonth(nextDueDate.getMonth() + months);
              }
            }
          } else {
            // Check if next due date has passed
            const lastDueDate = new Date(lastPayment.next_due_date);
            isDue = now >= lastDueDate;
            nextDueDate = new Date(lastDueDate);
          }

          if (!isDue) continue;

          // Calculate next due date
          if (fee.fee_type.includes('YEARLY_FEE')) {
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          } else {
            const periods: Record<string, number> = {
              'MONTHLY': 1,
              'QUARTERLY': 3,
              'HALF_YEARLY': 6,
              'YEARLY': 12,
            };
            const months = periods[fee.billing_period] || 12;
            nextDueDate.setMonth(nextDueDate.getMonth() + months);
          }

          // Check if user has sufficient balance
          const feeAmount = parseFloat(fee.amount);
          const currentBalance = parseFloat(wallet.balance);

          if (currentBalance < feeAmount) {
            results.errors.push(`Insufficient balance for user ${user.email}`);
            continue;
          }

          // Deduct from wallet
          const newBalance = currentBalance - feeAmount;
          const { error: walletError } = await supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('id', wallet.id);

          if (walletError) {
            results.errors.push(`Failed to update wallet for ${user.email}`);
            continue;
          }

          // Create transaction record
          const { data: transaction, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: user.id,
              wallet_id: wallet.id,
              type: 'FEE_DEDUCTION',
              amount: -feeAmount,
              status: 'COMPLETED',
              description: `${fee.description || fee.fee_type} - ${fee.billing_period}`,
              reference: `FEE_${fee.fee_type}_${Date.now()}`,
              metadata: {
                fee_type: fee.fee_type,
                billing_period: fee.billing_period,
                fee_id: fee.id,
              },
            })
            .select()
            .single();

          if (txError) {
            results.errors.push(`Failed to create transaction for ${user.email}`);
            continue;
          }

          // Record fee payment
          const { error: paymentError } = await supabaseAdmin
            .from('user_fee_payments')
            .insert({
              user_id: user.id,
              fee_type: fee.fee_type,
              amount: feeAmount,
              billing_period: fee.billing_period,
              payment_date: now.toISOString(),
              next_due_date: nextDueDate.toISOString(),
              status: 'COMPLETED',
              transaction_id: transaction.id,
            });

          if (paymentError) {
            results.errors.push(`Failed to record payment for ${user.email}`);
            continue;
          }

          results.processed++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing user ${user.email}: ${error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('Process fees error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing (admin only)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Fee processing endpoint',
    note: 'Use POST with cron secret to process fees',
  });
}
