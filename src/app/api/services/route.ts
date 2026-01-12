// app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Fetch active services for retailers and employees
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    // Allow access to retailers, employees, customers, and admin
    if (
      !user ||
      (user.role !== UserRole.RETAILER &&
        user.role !== UserRole.EMPLOYEE &&
        user.role !== UserRole.ADMIN &&
        user.role !== UserRole.CUSTOMER)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const is_free = searchParams.get('is_free');
    const search = searchParams.get('search');
    const state = searchParams.get('state');

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
        share_token,
        created_at,
        show_to_customer,
        customer_price,
        cashback_enabled,
        cashback_min_percentage,
        cashback_max_percentage,
        available_states,
        created_by_user:users!schemes_created_by_fkey(name)
      `)
      .eq('is_active', true)
      .is('external_url', null)
      .order('created_at', { ascending: false });

    // Filter services based on user role
    if (user.role === 'CUSTOMER') {
      // Customers only see services marked as show_to_customer = true
      query = query.eq('show_to_customer', true);
    }
    // Retailers, Employees, and Admin see all services (no filter)
    // This allows services enabled for customers to still show for retailers with their commission

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

    // State-based filtering
    if (state && state !== 'ALL') {
      // Filter services that are available ONLY in the specified state
      // Do NOT include nationwide services (ALL) when filtering by specific state
      query = query
        .filter('available_states', 'cs', `{${state}}`)
        .not('available_states', 'cs', '{ALL}');
    }

    const { data: services, error } = await query;

    if (error) {
      console.error('Services fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      services: services || [],
    });

  } catch (error) {
    console.error('Services API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
