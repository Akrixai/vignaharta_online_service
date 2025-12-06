import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// POST - Save draft application
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { scheme_id, draft_data, progress_percentage, current_step, total_steps } = body;

    if (!scheme_id || !draft_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if draft already exists for this user and scheme
    const { data: existingDraft } = await supabaseAdmin
      .from('application_drafts')
      .select('id')
      .eq('user_id', user.id)
      .eq('scheme_id', scheme_id)
      .single();

    if (existingDraft) {
      // Update existing draft
      const { data, error } = await supabaseAdmin
        .from('application_drafts')
        .update({
          draft_data,
          progress_percentage: progress_percentage || 0,
          current_step: current_step || 1,
          total_steps: total_steps || 5,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDraft.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating draft:', error);
        return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } else {
      // Create new draft
      const { data, error } = await supabaseAdmin
        .from('application_drafts')
        .insert({
          user_id: user.id,
          scheme_id,
          draft_data,
          progress_percentage: progress_percentage || 0,
          current_step: current_step || 1,
          total_steps: total_steps || 5,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating draft:', error);
        return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error('Draft API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get all drafts for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: drafts, error } = await supabaseAdmin
      .from('application_drafts')
      .select(`
        *,
        schemes (
          id,
          name,
          category,
          price
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching drafts:', error);
      return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: drafts });
  } catch (error) {
    console.error('Draft API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
