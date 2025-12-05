import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List support tickets
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tickets: data });
  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create support ticket
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, category, priority, description } = body;

    if (!subject || !category || !description) {
      return NextResponse.json({ error: 'Subject, category, and description are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        category,
        priority: priority || 'medium',
        description
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ticket: data, success: true });
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
