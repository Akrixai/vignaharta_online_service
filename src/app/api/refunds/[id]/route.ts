import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET /api/refunds/[id] - Get specific refund
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: refund, error } = await supabaseAdmin
      .from('refunds')
      .select(`
        *,
        user:users!refunds_user_id_fkey(id, name, email, phone),
        application:applications(id, scheme_id, customer_name),
        processed_by_user:users!refunds_processed_by_fkey(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    // Check access permissions
    if (session.user.role === UserRole.RETAILER && refund.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(refund);

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/refunds/[id] - Update refund status (admin/employee only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized - Admin/Employee access required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, admin_response } = body;

    if (!status || !['APPROVED', 'REJECTED', 'PROCESSED'].includes(status)) {
      return NextResponse.json({
        error: 'Valid status is required (APPROVED, REJECTED, PROCESSED)'
      }, { status: 400 });
    }

    // Get current refund
    const { data: currentRefund, error: fetchError } = await supabaseAdmin
      .from('refunds')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentRefund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    // Handle refund approval via atomic RPC if status is APPROVED
    if (status === 'APPROVED') {
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('approve_refund', {
        p_refund_id: id,
        p_admin_id: session.user.id,
        p_admin_response: admin_response || null
      });

      if (rpcError || !rpcResult?.success) {
        console.error('Refund approval RPC failed:', rpcError || rpcResult?.error);
        return NextResponse.json({
          error: rpcResult?.error || 'Failed to process refund approval'
        }, { status: 500 });
      }

      // Fetch the updated refund to return in response
      const { data: updatedRefund } = await supabaseAdmin
        .from('refunds')
        .select(`
          *,
          user:users!refunds_user_id_fkey(id, name, email, phone),
          application:applications(id, scheme_id, customer_name),
          processed_by_user:users!refunds_processed_by_fkey(id, name, email)
        `)
        .eq('id', id)
        .single();

      const refund = updatedRefund;

      // Create notification for retailer
      await supabaseAdmin
        .from('notifications')
        .insert({
          title: `Refund APPROVED`,
          message: `Your refund request for ₹${currentRefund.amount} has been approved and credited to your wallet balance.` + (admin_response ? `\n\nResponse: ${admin_response}` : ''),
          type: `REFUND_APPROVED`,
          data: { refund_id: id, amount: currentRefund.amount, status: 'APPROVED' },
          target_users: [currentRefund.user_id],
          created_by: session.user.id
        });

      return NextResponse.json({
        success: true,
        refund,
        message: `Refund approved and ₹${currentRefund.amount} credited to retailer wallet`
      });
    }

    // Handle other status updates (REJECTED, PROCESSED)
    const updateData: any = {
      status,
      processed_by: session.user.id,
      processed_at: new Date().toISOString()
    };

    if (admin_response) {
      updateData.admin_response = admin_response;
    }

    const { data: refund, error } = await supabaseAdmin
      .from('refunds')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users!refunds_user_id_fkey(id, name, email, phone),
        application:applications(id, scheme_id, customer_name),
        processed_by_user:users!refunds_processed_by_fkey(id, name, email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update refund' }, { status: 500 });
    }

    // Create notification for retailer for other status updates
    const notificationMessage = status === 'REJECTED'
      ? `Your refund request for ₹${currentRefund.amount} has been rejected`
      : `Your refund request for ₹${currentRefund.amount} has been processed`;

    await supabaseAdmin
      .from('notifications')
      .insert({
        title: `Refund ${status}`,
        message: notificationMessage + (admin_response ? `\n\nResponse: ${admin_response}` : ''),
        type: `REFUND_${status}`,
        data: { refund_id: refund.id, amount: currentRefund.amount, status },
        target_users: [currentRefund.user_id],
        created_by: session.user.id
      });

    return NextResponse.json({
      success: true,
      refund,
      message: status === 'APPROVED'
        ? `Refund approved and ₹${currentRefund.amount} credited to retailer wallet`
        : `Refund ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Refund update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
