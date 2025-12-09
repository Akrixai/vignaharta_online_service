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

    // If approved, handle commission payment (payment already deducted on submission)
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
            const currentBalance = parseFloat(wallet.balance.toString());
            const newBalance = currentBalance + commissionAmount;

            // Update wallet balance with commission
            await supabaseAdmin
              .from('wallets')
              .update({
                balance: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', wallet.id);

            // Create commission transaction
            await supabaseAdmin
              .from('transactions')
              .insert({
                user_id: existingApp.user_id,
                wallet_id: wallet.id,
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
      } catch (walletError) {
        console.error('Commission error:', walletError);
        return NextResponse.json(
          { error: 'Failed to process commission' },
          { status: 500 }
        );
      }
    }

    // Automatic refund logic for rejection (if payment was made)
    let refundInfo = null;
    if (status === 'REJECTED' && existingApp.payment_status === 'PAID' && !existingApp.refund_processed) {
      try {
        // Fetch wallet
        const { data: wallet, error: walletError } = await supabaseAdmin
          .from('wallets')
          .select('id, balance')
          .eq('user_id', existingApp.user_id)
          .single();

        if (wallet && !walletError) {
          const currentBalance = parseFloat(wallet.balance.toString());
          // Refund the total_amount (which includes GST and platform fee)
          const refundAmount = parseFloat(existingApp.total_amount?.toString() || existingApp.amount?.toString() || '0');
          const newBalance = currentBalance + refundAmount;

          // Update wallet
          const { error: updateError } = await supabaseAdmin
            .from('wallets')
            .update({ 
              balance: newBalance, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', wallet.id);

          if (!updateError) {
            // Create refund transaction
            const { data: refundTx, error: txError } = await supabaseAdmin
              .from('transactions')
              .insert({
                user_id: existingApp.user_id,
                wallet_id: wallet.id,
                type: 'REFUND',
                amount: refundAmount,
                status: 'COMPLETED',
                description: `Refund for rejected application #${applicationId}`,
                reference: `refund_${applicationId}`,
                metadata: {
                  application_id: applicationId,
                  original_amount: refundAmount,
                  rejection_reason: notes || 'Application rejected'
                },
                processed_by: session.user.id,
                processed_at: new Date().toISOString()
              })
              .select()
              .single();

            if (!txError && refundTx) {
              // Mark application as refunded
              await supabaseAdmin
                .from('applications')
                .update({ 
                  payment_status: 'REFUNDED',
                  refund_processed: true,
                  refund_processed_at: new Date().toISOString(),
                  refund_transaction_id: refundTx.id
                })
                .eq('id', applicationId);

              refundInfo = {
                refund_amount: refundAmount,
                new_balance: newBalance,
                transaction_id: refundTx.id
              };
            }
          }
        }
      } catch (refundError) {
        console.error('Refund error:', refundError);
        // Don't fail the rejection if refund fails, but log it
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: status === 'REJECTED' && refundInfo 
        ? `Application rejected and ₹${refundInfo.refund_amount.toFixed(2)} refunded to wallet`
        : 'Application updated successfully',
      application,
      refund_info: refundInfo
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
