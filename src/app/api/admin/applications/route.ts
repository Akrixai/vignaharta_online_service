import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Fetch all applications (Admin and Employee)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : null; // null means fetch all
    const offset = limit ? (page - 1) * limit : 0;

    let query = supabaseAdmin
      .from('applications')
      .select(`
        *,
        user:users!applications_user_id_fkey(id, name, email, phone),
        scheme:schemes!applications_scheme_id_fkey(id, name, price, category, dynamic_fields),
        approved_by_user:users!applications_approved_by_fkey(name),
        rejected_by_user:users!applications_rejected_by_fkey(name)
      `)
      .order('created_at', { ascending: false });

    // Only apply range if limit is specified
    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: applications, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'ALL') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({ 
      success: true, 
      applications: applications || [],
      pagination: limit ? {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      } : {
        page: 1,
        limit: totalCount || 0,
        total: totalCount || 0,
        totalPages: 1
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
