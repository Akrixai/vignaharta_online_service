import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scheme_id = searchParams.get('scheme_id');

    let query = supabase
      .from('application_drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_submitted', false)
      .gt('expires_at', new Date().toISOString());

    if (scheme_id) {
      query = query.eq('scheme_id', scheme_id);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ drafts: data || [] });
  } catch (error: any) {
    console.error('Get drafts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { scheme_id, draft_data, progress_percentage, current_step, total_steps } = body;

    if (!scheme_id || !draft_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if draft exists
    const { data: existing } = await supabase
      .from('application_drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheme_id', scheme_id)
      .eq('is_submitted', false)
      .single();

    let result;
    if (existing) {
      // Update existing draft
      const { data, error } = await supabase
        .from('application_drafts')
        .update({
          draft_data,
          progress_percentage: progress_percentage || existing.progress_percentage,
          current_step: current_step || existing.current_step,
          total_steps: total_steps || existing.total_steps,
          last_saved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new draft
      const { data, error } = await supabase
        .from('application_drafts')
        .insert({
          user_id: user.id,
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

    return NextResponse.json({ draft: result });
  } catch (error: any) {
    console.error('Save draft error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
