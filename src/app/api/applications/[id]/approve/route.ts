import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';

// POST /api/applications/[id]/approve - Approve application and debit payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = params.id;

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, schemes(*), users(*)')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status === 'APPROVED') {
      return NextResponse.json({ error: 'Application already approved' }, { status: 400 });
    }

    // Debit payment from wallet if total_amount > 0 and payment_status is PENDING
    let paymentTransaction = null;
    if (application.total_amount > 0 && application.payment_status === 'PENDING') {
      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', application.user_id)
        .single();

      if (walletError || !wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }

      const currentBalance = parseFloat(wallet.balance.toString());
      
      // Check if user has sufficient balance
      if (currentBalance < application.total_amount) {
        return NextResponse.json(
          { error: `Insufficient wallet balance. Required: ₹${application.total_amount}, Available: ₹${currentBalance}` },
          { status: 400 }
        );
      }

      // Deduct amount from wallet
      const newBalance = currentBalance - application.total_amount;
      const { error: walletUpdateError } = await supabaseAdmin
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (walletUpdateError) {
        return NextResponse.json(
          { error: 'Failed to deduct amount from wallet' },
          { status: 500 }
        );
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: application.user_id,
          wallet_id: wallet.id,
          type: 'SCHEME_PAYMENT',
          amount: -application.total_amount, // Negative for debit
          status: 'COMPLETED',
          description: `Payment for ${application.schemes.name} (Base: ₹${application.base_amount}, GST: ₹${application.gst_amount}, Platform Fee: ₹${application.platform_fee})`,
          reference: `application_${applicationId}`,
          metadata: {
            application_id: applicationId,
            base_amount: application.base_amount,
            gst_percentage: application.gst_percentage,
            gst_amount: application.gst_amount,
            platform_fee: application.platform_fee,
            total_amount: application.total_amount
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      paymentTransaction = transaction;

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
      }
    }

    // Update application status to APPROVED and payment_status to PAID
    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'APPROVED',
        payment_status: application.total_amount > 0 ? 'PAID' : 'PENDING',
        approved_by: session.user.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to approve application' },
        { status: 500 }
      );
    }

    // Send notification to user
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          title: 'Application Approved',
          message: `Your application for ${application.schemes.name} has been approved!${application.total_amount > 0 ? ` Payment of ₹${application.total_amount} has been debited from your wallet.` : ''}`,
          type: 'APPLICATION_APPROVED',
          data: {
            application_id: applicationId,
            scheme_name: application.schemes.name,
            total_amount: application.total_amount,
            payment_debited: application.total_amount > 0
          },
          target_users: [application.user_id],
          created_by: session.user.id
        });
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Application approved successfully',
      data: updatedApplication,
      payment_transaction: paymentTransaction
    });

  } catch (error) {
    console.error('Application approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
