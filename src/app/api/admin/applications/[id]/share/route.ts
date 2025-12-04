import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';
import { nanoid } from 'nanoid';

// POST /api/admin/applications/[id]/share - Create/Enable share link for application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicationId } = await params;
    const body = await request.json();
    const { expiresInDays } = body; // Optional: number of days until expiration

    // Check if application exists
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, status, share_token')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Allow sharing of approved, pending, and processing applications
    const allowedStatuses = ['APPROVED', 'PENDING', 'PROCESSING'];
    if (!allowedStatuses.includes(application.status)) {
      return NextResponse.json(
        { error: 'Only approved or processing applications can be shared' },
        { status: 400 }
      );
    }

    // Generate new token if doesn't exist
    const shareToken = application.share_token || nanoid(16);
    
    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiresInDays);
      expiresAt = expDate.toISOString();
    }

    // Update application with share details
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        share_token: shareToken,
        share_enabled: true,
        share_created_at: new Date().toISOString(),
        share_created_by: session.user.id,
        share_expires_at: expiresAt
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { error: 'Failed to enable sharing' },
        { status: 500 }
      );
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/share/application/${shareToken}`;

    return NextResponse.json({
      success: true,
      message: 'Share link created successfully',
      data: {
        share_token: shareToken,
        share_url: shareUrl,
        expires_at: expiresAt
      }
    });

  } catch (error) {
    console.error('Share application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/applications/[id]/share - Disable share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicationId } = await params;

    // Disable sharing
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        share_enabled: false
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error disabling share:', updateError);
      return NextResponse.json(
        { error: 'Failed to disable sharing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Share link disabled successfully'
    });

  } catch (error) {
    console.error('Disable share error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
