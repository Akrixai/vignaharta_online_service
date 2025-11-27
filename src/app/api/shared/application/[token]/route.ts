import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/shared/application/[token] - Get shared application details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const shareToken = params.token;

    // Fetch application with share token
    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        schemes:scheme_id (
          id,
          name,
          description,
          category,
          price,
          processing_time_days,
          dynamic_fields,
          image_url
        ),
        user:user_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('share_token', shareToken)
      .eq('share_enabled', true)
      .single();

    if (error || !application) {
      return NextResponse.json({ 
        error: 'Application not found or sharing is disabled' 
      }, { status: 404 });
    }

    // Check if share link has expired
    if (application.share_expires_at) {
      const expiresAt = new Date(application.share_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json({ 
          error: 'Share link has expired' 
        }, { status: 410 });
      }
    }

    // Increment view count
    await supabaseAdmin
      .from('applications')
      .update({
        share_view_count: (application.share_view_count || 0) + 1
      })
      .eq('id', application.id);

    // Remove sensitive information
    const sanitizedApplication = {
      id: application.id,
      customer_name: application.customer_name,
      customer_phone: application.customer_phone,
      customer_email: application.customer_email,
      customer_address: application.customer_address,
      status: application.status,
      amount: application.amount,
      form_data: application.form_data,
      documents: application.documents,
      dynamic_field_documents: application.dynamic_field_documents,
      created_at: application.created_at,
      processed_at: application.processed_at,
      notes: application.notes,
      scheme: application.schemes,
      submitted_by: {
        name: application.user?.name,
        email: application.user?.email
      }
    };

    return NextResponse.json({
      success: true,
      data: sanitizedApplication
    });

  } catch (error) {
    console.error('Shared application fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
