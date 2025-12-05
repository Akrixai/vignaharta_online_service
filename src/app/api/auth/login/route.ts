import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { corsHeaders, handleCorsPreflightRequest } from '@/lib/cors';

export async function OPTIONS() {
    return handleCorsPreflightRequest();
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, role } = body;

        console.log('Login attempt:', { email, role });

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email and password are required',
                },
                { status: 400, headers: corsHeaders }
            );
        }

        // Check if input is email or phone number
        const isPhone = /^\d{10}$/.test(email);

        // Query by email or phone
        let query = supabaseAdmin
            .from('users')
            .select(`
        id,
        email,
        name,
        phone,
        role,
        designation,
        password_hash,
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
      `);

        if (isPhone) {
            query = query.eq('phone', email);
        } else {
            query = query.eq('email', email);
        }

        // Add role filter if provided
        if (role) {
            query = query.eq('role', role.toUpperCase());
        }

        const { data: users, error } = await query;

        if (error) {
            console.error('Database query error:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: `Database error: ${error.message}`,
                },
                { status: 500, headers: corsHeaders }
            );
        }

        if (!users || users.length === 0) {
            console.log('No user found');
            return NextResponse.json(
                {
                    success: false,
                    message: role
                        ? `No ${role.toLowerCase()} account found with provided credentials`
                        : 'User not found',
                },
                { status: 401, headers: corsHeaders }
            );
        }

        const user = users[0];
        console.log('User found:', { id: user.id, email: user.email, role: user.role });

        // Check if user is active
        if (!user.is_active) {
            return NextResponse.json(
                {
                    success: false,
                    message: user.role === 'RETAILER'
                        ? 'Your retailer account is pending approval. Please contact support.'
                        : 'Your account is inactive. Please contact support.',
                },
                { status: 403, headers: corsHeaders }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            console.log('Invalid password');
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid password',
                },
                { status: 401, headers: corsHeaders }
            );
        }

        // Check if role matches (if provided)
        if (role && user.role?.toUpperCase() !== role.toUpperCase()) {
            console.log('Role mismatch:', { expected: role, actual: user.role });
            return NextResponse.json(
                {
                    success: false,
                    message: `Role mismatch. Expected ${role.toUpperCase()}, got ${user.role}`,
                },
                { status: 401, headers: corsHeaders }
            );
        }

        // Generate JWT token
        const token = sign(
            {
                sub: user.id.toString(),
                email: user.email,
                role: user.role,
                name: user.name,
            },
            process.env.NEXTAUTH_SECRET || 'fallback-secret',
            { expiresIn: '24h' }
        );

        console.log('Login successful');

        // Return success response
        return NextResponse.json(
            {
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user_id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                    designation: user.designation,
                    is_active: user.is_active,
                    address: user.address,
                    city: user.city,
                    state: user.state,
                    pincode: user.pincode,
                    date_of_birth: user.date_of_birth,
                    gender: user.gender,
                    occupation: user.occupation,
                    employee_id: user.employee_id,
                    department: user.department,
                    profile_photo_url: user.profile_photo_url,
                    referral_code: user.referral_code,
                    territory_state: user.territory_state,
                    territory_district: user.territory_district,
                    territory_area: user.territory_area,
                    parent_employee_id: user.parent_employee_id,
                    created_at: user.created_at,
                    wallet: user.wallets?.[0] || null,
                },
            },
            { status: 200, headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || 'An error occurred during login',
            },
            { status: 500, headers: corsHeaders }
        );
    }
}
