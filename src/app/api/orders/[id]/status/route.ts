import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';
// Real-time notifications will be handled by Supabase real-time

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and employee can update order status
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only admin and employees can update order status.' },
        { status: 403 }
      );
    }

    const { status } = await request.json();
    const orderId = params.id;

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update order status in database
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'SHIPPED' && { shipped_at: new Date().toISOString() }),
        ...(status === 'DELIVERED' && { delivered_at: new Date().toISOString() })
      })
      .eq('id', orderId)
      .select('id, user_id, status')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    // Send real-time notification to retailer
    try {
      const statusMessages = {
        'CONFIRMED': 'Your order has been confirmed and is being processed',
        'SHIPPED': 'Your order has been shipped and is on the way',
        'DELIVERED': 'Your order has been delivered successfully',
        'CANCELLED': 'Your order has been cancelled'
      };

      await pusher.trigger(`retailer-${updatedOrder.user_id}`, 'order-status-updated', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        message: statusMessages[updatedOrder.status as keyof typeof statusMessages] || `Order status updated to ${updatedOrder.status}`,
        updatedBy: session.user.name,
        updatedByRole: session.user.role,
        timestamp: new Date().toISOString(),
        title: `Order ${updatedOrder.status.toLowerCase()}`
      });

    } catch (pusherError) {
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
