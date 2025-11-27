import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Create admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: draft, error } = await supabaseAdmin
      .from('application_drafts')
      .select(`
        *,
        schemes:scheme_id (
          id,
          name,
          description,
          price,
          category,
          image_url,
          dynamic_fields,
          required_documents
        )
      `)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error) throw error;

    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: draft
    });
  } catch (error: any) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}
