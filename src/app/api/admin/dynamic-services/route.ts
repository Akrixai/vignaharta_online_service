import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all dynamic services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';

    let query = supabase
      .from('dynamic_services')
      .select('*')
      .order('display_order', { ascending: true });

    if (isPublic) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ services: data });
  } catch (error: any) {
    console.error('Error fetching dynamic services:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new dynamic service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, icon, category, features, price_text, display_order } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('dynamic_services')
      .insert({
        title,
        description,
        icon,
        category,
        features: features || [],
        price_text,
        display_order: display_order || 0,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ service: data, success: true });
  } catch (error: any) {
    console.error('Error creating dynamic service:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
