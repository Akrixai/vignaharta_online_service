import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// PUT - Update application status (Admin and Employee)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;
    const { status, notes } = body;

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if application exists
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      updateData.processed_at = new Date().toISOString();

      if (status === 'APPROVED') {
        updateData.approved_by = session.user.id;
      } else if (status === 'REJECTED') {
        updateData.rejected_by = session.user.id;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select(`
        *,
        user:users!applications_user_id_fkey(id, name, email),
        scheme:schemes!applications_scheme_id_fkey(id, name, price)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // If approved, handle payment deduction and commission
    if (status === 'APPROVED' && existingApp.status === 'PENDING') {
      try {
        // Get user wallet
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('id, balance')
          .eq('user_id', existingApp.user_id)
          .single();

        if (!wallet) {
          return NextResponse.json(
            { error: 'Wallet not found for user' },
            { status: 404 }
          );
        }

        const totalAmount = parseFloat(existingApp.total_amount?.toString() || existingApp.amount?.toString() || '0');
        
        // Deduct payment from wallet if total_amount > 0 and payment not already made
        if (totalAmount > 0 && existingApp.payment_status === 'PENDING') {
          const currentBalance = parseFloat(wallet.balance.toString());
          
          // Check if user has sufficient balance
          if (currentBalance < totalAmount) {
            return NextResponse.json(
              { error: `Insufficient wallet balance. Required: ₹${totalAmount}, Available: ₹${currentBalance}` },
              { status: 400 }
            );
          }

          // Deduct amount from wallet
          const newBalanceAfterPayment = currentBalance - totalAmount;
          await supabaseAdmin
            .from('wallets')
            .update({
              balance: newBalanceAfterPayment,
              updated_at: new Date().toISOString()
            })
            .eq('id', wallet.id);

          // Create payment transaction
          await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: existingApp.user_id,
              wallet_id: wallet.id,
              type: 'SCHEME_PAYMENT',
              amount: -totalAmount, // Negative for debit
              status: 'COMPLETED',
              description: `Payment for application #${applicationId} (Base: ₹${existingApp.base_amount || 0}, GST: ₹${existingApp.gst_amount || 0}, Platform Fee: ₹${existingApp.platform_fee || 0})`,
              reference: `application_${applicationId}`,
              metadata: {
                application_id: applicationId,
                base_amount: existingApp.base_amount || 0,
                gst_percentage: existingApp.gst_percentage || 0,
                gst_amount: existingApp.gst_amount || 0,
                platform_fee: existingApp.platform_fee || 0,
                total_amount: totalAmount
              },
              processed_by: session.user.id,
              processed_at: new Date().toISOString()
            });

          // Update application payment status
          await supabaseAdmin
            .from('applications')
            .update({ payment_status: 'PAID' })
            .eq('id', applicationId);
        }

        // Handle commission payment for retailers (not customers)
        if (!existingApp.commission_paid) {
          // Get scheme details
          const { data: scheme } = await supabaseAdmin
            .from('schemes')
            .select('commission_rate')
            .eq('id', existingApp.scheme_id)
            .single();

          // Get user details to check role
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', existingApp.user_id)
            .single();

          const commissionRate = scheme?.commission_rate || 0;
          // Use base_amount for commission calculation (not total_amount which includes GST and platform fee)
          const applicationAmount = parseFloat(existingApp.base_amount?.toString() || existingApp.amount?.toString() || '0');
          const commissionAmount = (applicationAmount * commissionRate) / 100;

          // Only pay commission to retailers, not customers
          if (commissionAmount > 0 && user?.role === 'RETAILER') {
            // Get updated wallet balance
            const { data: updatedWallet } = await supabaseAdmin
              .from('wallets')
              .select('id, balance')
              .eq('user_id', existingApp.user_id)
              .single();

            if (updatedWallet) {
              const currentBalance = parseFloat(updatedWallet.balance.toString());
              const newBalance = currentBalance + commissionAmount;

              // Update wallet balance with commission
              await supabaseAdmin
                .from('wallets')
                .update({
                  balance: newBalance,
                  updated_at: new Date().toISOString()
                })
                .eq('id', updatedWallet.id);

              // Create commission transaction
              await supabaseAdmin
                .from('transactions')
                .insert({
                  user_id: existingApp.user_id,
                  wallet_id: updatedWallet.id,
                  type: 'COMMISSION',
                  amount: commissionAmount,
                  status: 'COMPLETED',
                  description: `Commission for approved application #${applicationId} (${commissionRate}% of ₹${applicationAmount})`,
                  reference: `COMM_${applicationId}`,
                  metadata: {
                    application_id: applicationId,
                    commission_rate: commissionRate,
                    base_amount: applicationAmount
                  },
                  processed_by: session.user.id,
                  processed_at: new Date().toISOString()
                });

              // Mark commission as paid in application
              await supabaseAdmin
                .from('applications')
                .update({
                  commission_rate: commissionRate,
                  commission_amount: commissionAmount,
                  commission_paid: true,
                  commission_paid_at: new Date().toISOString()
                })
                .eq('id', applicationId);
            }
          }
        }
      } catch (walletError) {
        console.error('Wallet/Commission error:', walletError);
        return NextResponse.json(
          { error: 'Failed to process payment or commission' },
          { status: 500 }
        );
      }
    }

    // Refund logic for admin rejection
    let updatedWallet = null;
    let refundTransaction = null;
    if (status === 'REJECTED' && body.refund === true && existingApp.payment_status === 'PAID') {

      // Fetch wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', existingApp.user_id)
        .single();
      if (walletError || !wallet) {
      } else {
        const currentBalance = parseFloat(wallet.balance.toString());
        // Refund the total_amount (which includes GST and platform fee)
        const refundAmount = parseFloat(existingApp.total_amount?.toString() || existingApp.amount?.toString() || '0');
        const newBalance = currentBalance + refundAmount;
        // Update wallet
        const { data: walletData, error: updateError } = await supabaseAdmin
          .from('wallets')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', wallet.id)
          .select()
          .single();
        updatedWallet = walletData;
        if (updateError) {
        } else {

        }
        // Create refund transaction
        const { data: refundTx, error: txError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: existingApp.user_id,
            wallet_id: wallet.id,
            type: 'REFUND',
            amount: refundAmount,
            status: 'COMPLETED',
            description: `Refund for rejected application: ${applicationId}`,
            reference: `refund_${applicationId}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        refundTransaction = refundTx;
        if (txError) {
        } else {
          // Mark application as refunded
          await supabaseAdmin
            .from('applications')
            .update({ payment_status: 'REFUNDED' })
            .eq('id', applicationId);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Application updated successfully',
      application,
      wallet: updatedWallet,
      refund_transaction: refundTransaction
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete application (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    // Check if application exists
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, status, customer_name')
      .eq('id', applicationId)
      .single();

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Admin can delete any application - removed restriction
    // Log the deletion for audit purposes

    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Application deleted successfully' 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
