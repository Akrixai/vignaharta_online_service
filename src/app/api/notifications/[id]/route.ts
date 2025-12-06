import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase';

// DELETE /api/notifications/[id] - Delete specific notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and EMPLOYEE to delete notifications
    if (user.role !== 'ADMIN' && user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: notificationId } = await params;

    if (!notificationId) {
      return NextResponse.json({
        error: 'Notification ID is required'
      }, { status: 400 });
    }

    // First check if the notification exists and user has access to it
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('id, target_roles, target_users')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json({
        error: 'Notification not found'
      }, { status: 404 });
    }

    // Check if user has access to this notification
    const hasAccess =
      (notification.target_roles && notification.target_roles.includes(user.role)) ||
      (notification.target_users && notification.target_users.includes(user.id));

    if (!hasAccess) {
      return NextResponse.json({
        error: 'Access denied to this notification'
      }, { status: 403 });
    }

    // Delete the notification
    const { error: deleteError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (deleteError) {
      return NextResponse.json({
        error: 'Failed to delete notification'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
