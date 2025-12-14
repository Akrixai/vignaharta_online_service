import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// Add CORS headers for cross-origin requests (Flutter app)
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// GET /api/auth/profile - Get current user profile
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        // Fetch full user profile
        const { data: profile, error } = await supabaseAdmin
            .from('users')
            .select(`
        id,
        email,
        name,
        phone,
        role,
        is_active,
        address,
        city,
        state,
        pincode,
        date_of_birth,
        gender,
        occupation,
        employee_id,
        department,
        profile_photo_url,
        referral_code,
        territory_state,
        territory_district,
        territory_area,
        parent_employee_id,
        created_at,
        wallets (
          id,
          balance
        )
      `)
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            return addCorsHeaders(NextResponse.json({ error: 'User not found' }, { status: 404 }));
        }

        // Format response to match what Flutter app expects
        const formattedProfile = {
            ...profile,
            wallet: profile.wallets?.[0] || null,
            user_id: profile.id // Flutter app expects user_id
        };

        return addCorsHeaders(NextResponse.json({
            success: true,
            data: formattedProfile
        }));

    } catch (error) {
        console.error('Profile API error:', error);
        return addCorsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
    }
}

// PUT /api/auth/profile - Update user profile
export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const body = await request.json();

        // Remove sensitive fields that shouldn't be updated directly
        delete body.id;
        delete body.email;
        delete body.role;
        delete body.password;
        delete body.wallet;
        delete body.is_active;

        const { data: updatedProfile, error } = await supabaseAdmin
            .from('users')
            .update(body)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            return addCorsHeaders(NextResponse.json({ error: 'Failed to update profile' }, { status: 500 }));
        }

        return addCorsHeaders(NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedProfile
        }));

    } catch (error) {
        return addCorsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
    }
}
