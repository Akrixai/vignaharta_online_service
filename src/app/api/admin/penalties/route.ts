import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get all penalties
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: penalties, error } = await supabaseAdmin
      .from('penalties')
      .select(`
        *,
        user:user_id(id, name, email, role)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: penalties });
  } catch (error: any) {
    console.error('Error fetching penalties:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Apply penalty
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, amount, reason, description, penalty_type } = body;

    if (!user_id || !amount || !reason) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Call the apply_penalty function
    const { data: result, error } = await supabaseAdmin
      .rpc('apply_penalty', {
        p_user_id: user_id,
        p_amount: amount,
        p_reason: reason,
        p_description: description || '',
        p_penalty_type: penalty_type || 'GENERAL',
        p_applied_by: session.user.id
      });

    if (error) throw error;

    const penaltyResult = result as any;

    if (!penaltyResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: penaltyResult.error 
      }, { status: 400 });
    }

    // Send email notification
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/emails/penalty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: penaltyResult.user_email,
          user_name: penaltyResult.user_name,
          amount,
          reason,
          description,
          penalty_type,
          penalty_id: penaltyResult.penalty_id
        })
      });

      // Mark email as sent
      await supabaseAdmin
        .from('penalties')
        .update({ 
          email_sent: true, 
          email_sent_at: new Date().toISOString() 
        })
        .eq('id', penaltyResult.penalty_id);
    } catch (emailError) {
      console.error('Error sending penalty email:', emailError);
      // Don't fail the penalty application if email fails
    }

    return NextResponse.json({ 
      success: true, 
      data: penaltyResult 
    });
  } catch (error: any) {
    console.error('Error applying penalty:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
