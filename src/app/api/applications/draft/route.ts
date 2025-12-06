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

    // Support both formats:
    // 1. Website format: { scheme_id, draft_data, progress_percentage, current_step, total_steps }
    // 2. App format: { scheme_id, customer_name, customer_phone, ..., form_data, status }

    let scheme_id = body.scheme_id;
    let draft_data;
    let progress_percentage = body.progress_percentage || 0;
    let current_step = body.current_step || 1;
    let total_steps = body.total_steps || 5;

    // Check if this is the app format (has customer_name, form_data, etc.)
    if (body.customer_name || body.form_data) {
      // App format - wrap the entire body as draft_data
      draft_data = {
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email,
        customer_address: body.customer_address,
        amount: body.amount,
        form_data: body.form_data,
        status: body.status || 'DRAFT'
      };
    } else {
      // Website format - draft_data is already provided
      draft_data = body.draft_data;
    }

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
          progress_percentage,
          current_step,
          total_steps,
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
          progress_percentage,
          current_step,
          total_steps,
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
