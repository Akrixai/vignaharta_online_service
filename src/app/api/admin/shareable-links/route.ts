import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/types';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all shareable links
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('shareable_application_links')
      .select(`
        *,
        scheme:schemes(id, name, category),
        creator:users!created_by(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ links: data });
  } catch (error: any) {
    console.error('Error fetching shareable links:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new shareable link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { scheme_id, title, description, allowed_roles, allowed_user_ids, expires_at, max_access_count } = body;

    if (!scheme_id || !title) {
      return NextResponse.json({ error: 'Scheme ID and title are required' }, { status: 400 });
    }

    // Generate unique token
    const link_token = crypto.randomBytes(32).toString('hex');

    const { data, error } = await supabase
      .from('shareable_application_links')
      .insert({
        scheme_id,
        created_by: session.user.id,
        link_token,
        title,
        description,
        allowed_roles: allowed_roles || ['RETAILER'],
        allowed_user_ids: allowed_user_ids || [],
        expires_at,
        max_access_count
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ link: data, success: true });
  } catch (error: any) {
    console.error('Error creating shareable link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
