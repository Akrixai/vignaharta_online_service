import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';
import { sendNewFreeServiceNotifications } from '@/lib/email-service';

// GET - Fetch all free services
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For admins, show both free services and external URL services
    const { data: freeServices, error } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .or('is_free.eq.true,external_url.not.is.null') // Free services OR services with external URL
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch free services'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      freeServices: freeServices || []
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create new free service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();

    const { name, description, category, external_url } = requestBody;

    // Validation
    if (!name || !description || !category || !external_url) {
      return NextResponse.json({
        error: 'Name, description, category, and external URL are required'
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(external_url);
    } catch {
      return NextResponse.json({
        error: 'Invalid URL format'
      }, { status: 400 });
    }

    // Create free service
    const serviceData = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      external_url: external_url.trim(),
      price: 0,
      is_free: true,
      is_active: true,
      processing_time_days: 0,
      commission_rate: 0,
      created_by: session.user.id
    };

    const { data: freeService, error } = await supabaseAdmin
      .from('schemes')
      .insert(serviceData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Failed to create free service',
        details: error.message
      }, { status: 500 });
    }

    // Send email notifications to employees and admin only (not retailers)
    try {
      await sendNewFreeServiceNotifications(
        freeService.id,
        freeService.name,
        freeService.description || 'New free service available'
      );
    } catch (emailError) {
      // Don't fail the API if email fails
    }

    return NextResponse.json({
      success: true,
      freeService
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
