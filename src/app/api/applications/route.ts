import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';

// GET /api/applications - Get applications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000'); // Increased default limit to show all applications
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('applications')
      .select(`
        id,
        user_id,
        scheme_id,
        form_data,
        documents,
        dynamic_field_documents,
        status,
        amount,
        notes,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        created_at,
        updated_at,
        processed_at,
        approved_by,
        rejected_by,
        schemes!applications_scheme_id_fkey (
          id,
          name,
          description,
          price,
          category
        ),
        users!applications_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter based on user role
    if (session.user.role === 'RETAILER' || session.user.role === 'CUSTOMER') {
      // Retailers and Customers only see their own applications
      query = query.eq('user_id', session.user.id);
    }
    // Admin and Employee can see all applications

    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true });

    // Filter based on user role for count
    if (session.user.role === 'RETAILER' || session.user.role === 'CUSTOMER') {
      countQuery = countQuery.eq('user_id', session.user.id);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: applications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== UserRole.RETAILER && session.user.role !== UserRole.CUSTOMER)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      scheme_id,
      form_data,
      documents,
      dynamic_field_documents,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      amount,
      is_reapply = false,
      original_application_id,
      fee_breakdown
    } = body;

    // Validate required fields
    if (!scheme_id || !customer_name || !customer_phone || !customer_address) {
      return NextResponse.json(
        { error: 'Scheme ID, customer name, phone, and address are required' },
        { status: 400 }
      );
    }

    // Get scheme details
    const { data: scheme, error: schemeError } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('id', scheme_id)
      .eq('is_active', true)
      .single();

    if (schemeError || !scheme) {
      return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
    }

    // Calculate fee breakdown if not provided
    let calculatedFeeBreakdown = fee_breakdown;
    if (!calculatedFeeBreakdown && !scheme.is_free && scheme.price > 0) {
      const baseAmount = scheme.price;
      const gstPercentage = 2; // 2% GST
      const gstAmount = (baseAmount * gstPercentage) / 100;
      const platformFee = 5; // ₹5 platform fee
      const totalAmount = baseAmount + gstAmount + platformFee;

      calculatedFeeBreakdown = {
        base_amount: parseFloat(baseAmount.toFixed(2)),
        gst_percentage: gstPercentage,
        gst_amount: parseFloat(gstAmount.toFixed(2)),
        platform_fee: platformFee,
        total_amount: parseFloat(totalAmount.toFixed(2))
      };
    }

    // Check if user has sufficient balance (but don't debit yet - will debit after approval)
    if (!scheme.is_free && calculatedFeeBreakdown && calculatedFeeBreakdown.total_amount > 0) {
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', session.user.id)
        .single();

      let currentBalance = 0;
      if (walletError || !wallet) {
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createWalletError } = await supabaseAdmin
          .from('wallets')
          .insert({
            user_id: session.user.id,
            balance: 0
          })
          .select('id, balance')
          .single();

        if (createWalletError || !newWallet) {
          return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
        }

        currentBalance = 0;
      } else {
        currentBalance = parseFloat(wallet.balance.toString());
      }

      // Check if user has sufficient balance (but don't debit yet)
      if (currentBalance < calculatedFeeBreakdown.total_amount) {
        return NextResponse.json(
          { error: `Insufficient wallet balance. Required: ₹${calculatedFeeBreakdown.total_amount}, Available: ₹${currentBalance}` },
          { status: 400 }
        );
      }
    }

    // Calculate cashback for customers
    let cashbackPercentage = 0;
    let cashbackAmount = 0;
    
    if (session.user.role === UserRole.CUSTOMER && scheme.cashback_enabled) {
      const minCashback = parseFloat(scheme.cashback_min_percentage || 1);
      const maxCashback = parseFloat(scheme.cashback_max_percentage || 3);
      
      // Generate random cashback percentage between min and max
      cashbackPercentage = Math.random() * (maxCashback - minCashback) + minCashback;
      cashbackPercentage = Math.round(cashbackPercentage * 100) / 100; // Round to 2 decimals
      
      // Calculate cashback amount
      const servicePrice = parseFloat(amount || scheme.price || 0);
      cashbackAmount = (servicePrice * cashbackPercentage) / 100;
      cashbackAmount = Math.round(cashbackAmount * 100) / 100; // Round to 2 decimals
    }

    // Create application with fee breakdown
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: session.user.id,
        scheme_id,
        form_data: form_data || {},
        documents: documents || [],
        dynamic_field_documents: dynamic_field_documents || {},
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        amount: amount || (scheme.is_free ? 0 : scheme.price),
        base_amount: calculatedFeeBreakdown?.base_amount || 0,
        gst_percentage: calculatedFeeBreakdown?.gst_percentage || 0,
        gst_amount: calculatedFeeBreakdown?.gst_amount || 0,
        platform_fee: calculatedFeeBreakdown?.platform_fee || 0,
        total_amount: calculatedFeeBreakdown?.total_amount || 0,
        payment_status: 'PENDING', // Will be PAID after approval
        status: 'PENDING',
        notes: is_reapply ? `REAPPLICATION - Original Application ID: ${original_application_id}` : null,
        commission_rate: session.user.role === UserRole.RETAILER ? (scheme.commission_rate || 0) : 0,
        commission_paid: false,
        cashback_percentage: cashbackPercentage,
        cashback_amount: cashbackAmount,
        cashback_claimed: false,
        scratch_card_revealed: false
      })
      .select(`
        id,
        form_data,
        documents,
        dynamic_field_documents,
        status,
        amount,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        created_at,
        schemes (
          id,
          name,
          description,
          price,
          category
        )
      `)
      .single();

    if (applicationError) {
      return NextResponse.json({
        error: 'Failed to create application',
        details: applicationError.message
      }, { status: 500 });
    }

    // Send real-time notification to admins/employees
    try {
      const notificationTitle = is_reapply ? 'New Reapplication Submitted' : 'New Application Submitted';
      const notificationMessage = is_reapply
        ? `${session.user.name} submitted a reapplication for ${scheme.name}`
        : `${session.user.name} submitted an application for ${scheme.name}`;

      const { data: notif, error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          title: notificationTitle,
          message: notificationMessage,
          type: 'APPLICATION_SUBMITTED',
          data: {
            application_id: application.id,
            scheme_name: scheme.name,
            customer_name,
            retailer_name: session.user.name,
            amount: amount || (scheme.is_free ? 0 : scheme.price),
            is_reapply: is_reapply,
            original_application_id: original_application_id
          },
          target_roles: ['ADMIN', 'EMPLOYEE'],
          created_by: session.user.id
        })
        .select()
        .single();
      if (notifError) {
      } else {

      }
    } catch (notificationError) {
      // Don't fail the application creation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully. Payment will be debited after approval.',
      data: application,
      fee_breakdown: calculatedFeeBreakdown
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
