import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/recruitments - Get all active recruitments (public) or all (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'EMPLOYEE';

    let query = supabaseAdmin
      .from('recruitments')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Only show active recruitments to public
    if (!includeInactive || !isAdmin) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      recruitments: data || [],
    });
  } catch (error: any) {
    console.error('Error fetching recruitments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch recruitments' },
      { status: 500 }
    );
  }
}

// POST /api/recruitments - Create new recruitment (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    if (!job_title || !job_description || !google_form_url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('recruitments')
      .insert({
        job_title,
        job_description,
        department,
        location,
        employment_type: employment_type || 'FULL_TIME',
        experience_required,
        qualifications,
        salary_range,
        google_form_url,
        closing_date: closing_date || null,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      recruitment: data,
    });
  } catch (error: any) {
    console.error('Error creating recruitment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create recruitment' },
      { status: 500 }
    );
  }
}
