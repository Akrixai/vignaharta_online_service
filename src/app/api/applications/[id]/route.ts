import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: applicationId } = await params;

    // Fetch application with service details
    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        schemes (
          id,
          name,
          description,
          category,
          price,
          is_free
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch application' },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this application
    const userRole = user.role;
    const userId = user.id;

    if (userRole === 'RETAILER' || userRole === 'CUSTOMER') {
      // Retailers and customers can only view their own applications
      if (application.user_id !== userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized to view this application' },
          { status: 403 }
        );
      }
    }
    // Admin and employees can view all applications

    return NextResponse.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error in GET /api/applications/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
