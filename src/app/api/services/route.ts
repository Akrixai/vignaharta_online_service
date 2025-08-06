// app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Fetch active services for retailers and employees
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow access to retailers and employees
    if (
      !session ||
      (session.user.role !== UserRole.RETAILER &&
        session.user.role !== UserRole.EMPLOYEE &&
        session.user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const is_free = searchParams.get('is_free');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('schemes')
      .select(`
        id,
        name,
        description,
        price,
        is_free,
        is_active,
        category,
        documents,
        processing_time_days,
        commission_rate,
        dynamic_fields,
        required_documents,
        image_url,
        external_url,
        created_at,
        created_by_user:users!schemes_created_by_fkey(name)
      `)
      .eq('is_active', true)
      .is('external_url', null)
      .order('created_at', { ascending: false });

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (is_free === 'true') {
      query = query.eq('is_free', true);
    } else if (is_free === 'false') {
      query = query.eq('is_free', false);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: services, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      services: services || [],
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
