import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeRetailerEmail, sendWelcomeEmployeeEmail } from '@/lib/email-service';

// POST - Approve manual registration with payment verification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { registrationId, walletRequestId, adminNotes } = await request.json();

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    // Get the pending registration
    const { data: registration, error: fetchError } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('id', registrationId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !registration) {
      return NextResponse.json({ error: 'Registration not found or already processed' }, { status: 404 });
    }

    // Create the user account
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        address: registration.address,
        city: registration.city,
        state: registration.state,
        pincode: registration.pincode,
        password_hash: registration.password_hash,
        role: registration.role,
        is_active: true,
        created_by: session.user.id,
        business_name: registration.business_name || null,
        shop_photo_url: registration.shop_photo_url || null,
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }
    // Create wallet for the user
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: user.id,
        balance: 0
      });

    if (walletError) {
      console.error('Wallet creation error:', walletError);
      // Don't fail approval if wallet creation fails
    }

    // Update registration status
    const { error: updateError } = await supabaseAdmin
      .from('pending_registrations')
      .update({
        status: 'approved',
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', registrationId);

    if (updateError) {
      console.error('Registration update error:', updateError);
    }

    // If there's an associated wallet request, approve it too
    if (walletRequestId) {
      const { error: walletRequestError } = await supabaseAdmin
        .from('wallet_requests')
        .update({
          user_id: user.id, // Link to the newly created user
          status: 'APPROVED',
          approved_by: session.user.id,
          approved_at: new Date().toISOString(),
          processed_by: session.user.id,
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes || 'Registration payment approved',
        })
        .eq('id', walletRequestId);

      if (walletRequestError) {
        console.error('Wallet request update error:', walletRequestError);
      }
    }

    // Send approval notifications
    try {
      // Send welcome email
      if (registration.role === UserRole.RETAILER) {
        await sendWelcomeRetailerEmail(
          registration.name, 
          registration.email, 
          'Your registration has been approved! Please login with your registered password.'
        );
      } else if (registration.role === UserRole.EMPLOYEE) {
        await sendWelcomeEmployeeEmail(
          registration.name, 
          registration.email, 
          'Your registration has been approved! Please login with your registered password.'
        );
      }
    } catch (notificationError) {
      console.error('Email notification error:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Registration and payment approved successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Manual registration approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}