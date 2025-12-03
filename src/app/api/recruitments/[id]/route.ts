import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/recruitments/[id] - Get single recruitment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabaseAdmin
      .from('recruitments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Recruitment not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await supabaseAdmin
      .from('recruitments')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      recruitment: data,
    });
  } catch (error: any) {
    console.error('Error fetching recruitment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch recruitment' },
      { status: 500 }
    );
  }
}

// PUT /api/recruitments/[id] - Update recruitment (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      job_title,
      job_description,
      department,
      location,
      employment_type,
      experience_required,
      qualifications,
      salary_range,
      google_form_url,
      closing_date,
      display_order,
      is_active,
    } = body;

    const { data, error } = await supabaseAdmin
      .from('recruitments')
      .update({
        job_title,
        job_description,
        department,
        location,
        employment_type,
        experience_required,
        qualifications,
        salary_range,
        google_form_url,
        closing_date: closing_date || null,
        display_order,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      recruitment: data,
    });
  } catch (error: any) {
    console.error('Error updating recruitment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update recruitment' },
      { status: 500 }
    );
  }
}

// DELETE /api/recruitments/[id] - Delete recruitment (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    const { error } = await supabaseAdmin
      .from('recruitments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Recruitment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting recruitment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete recruitment' },
      { status: 500 }
    );
  }
}
