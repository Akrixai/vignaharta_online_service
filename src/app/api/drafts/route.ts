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

// Get all drafts for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only retailers and customers can have drafts
    if (session.user.role !== 'RETAILER' && session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { data: drafts, error } = await supabaseAdmin
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
          required_documents,
          is_free
        )
      `)
      .eq('user_id', session.user.id)
      .eq('is_submitted', false)
      .order('last_saved_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: drafts || []
    });
  } catch (error: any) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

// Create or update draft
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RETAILER' && session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { scheme_id, draft_data, progress_percentage, current_step, total_steps } = body;

    if (!scheme_id) {
      return NextResponse.json({ success: false, error: 'Scheme ID is required' }, { status: 400 });
    }

    // Check if draft already exists
    const { data: existingDraft } = await supabaseAdmin
      .from('application_drafts')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('scheme_id', scheme_id)
      .eq('is_submitted', false)
      .single();

    let result;
    if (existingDraft) {
      // Update existing draft
      const { data, error } = await supabaseAdmin
        .from('application_drafts')
        .update({
          draft_data,
          progress_percentage: progress_percentage || 0,
          current_step: current_step || 1,
          total_steps: total_steps || 5,
          last_saved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraft.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new draft
      const { data, error } = await supabaseAdmin
        .from('application_drafts')
        .insert({
          user_id: session.user.id,
          scheme_id,
          draft_data,
          progress_percentage: progress_percentage || 0,
          current_step: current_step || 1,
          total_steps: total_steps || 5
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Draft saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save draft' },
      { status: 500 }
    );
  }
}

// Delete draft
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ success: false, error: 'Draft ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: draft } = await supabaseAdmin
      .from('application_drafts')
      .select('user_id')
      .eq('id', draftId)
      .single();

    if (!draft || draft.user_id !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Draft not found or access denied' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('application_drafts')
      .delete()
      .eq('id', draftId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
