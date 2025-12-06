import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// POST - Apply for a service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Updated to Promise for Next.js 15+ compat
) {
  try {
    const user = await getAuthenticatedUser(request);

    // Check if user is authenticated and has permitted role (Retailer or Customer)
    if (!user || (user.role !== UserRole.RETAILER && user.role !== UserRole.CUSTOMER)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: serviceId } = await params;
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      form_data,
      documents,
      retailer_id
    } = body;

    // Validate required fields
    if (!customer_name || !customer_phone) {
      return NextResponse.json({
        error: 'Customer name and phone are required'
      }, { status: 400 });
    }

    // Validate phone number
    if (!/^[0-9]{10}$/.test(customer_phone)) {
      return NextResponse.json({
        error: 'Invalid mobile number. Must be 10 digits.'
      }, { status: 400 });
    }

    // Get service details from schemes table (both government and other services)
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({
        error: 'Service not found'
      }, { status: 404 });
    }

    // Check if service is active
    if (!service.is_active) {
      return NextResponse.json({
        error: 'This service is currently not available'
      }, { status: 400 });
    }

    // Use retailer_id from request or session user id
    const userId = retailer_id || user.id;

    // Get retailer's wallet for payment processing
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({
        error: 'Wallet not found. Please contact support.'
      }, { status: 404 });
    }

    const servicePrice = service.is_free ? 0 : parseFloat(service.price);

    // Check wallet balance if service is not free
    if (!service.is_free && wallet.balance < servicePrice) {
      return NextResponse.json({
        error: `Insufficient wallet balance. Required: ₹${servicePrice}, Available: ₹${wallet.balance}`
      }, { status: 400 });
    }

    // Create application record similar to Aadhaar verification
    const applicationData = {
      user_id: userId,
      scheme_id: serviceId,
      form_data: {
        service_name: service.name,
        service_type: service.category || 'government_service',
        service_category: service.category,
        processing_time: service.processing_time_days,
        commission_rate: service.commission_rate,
        ...form_data
      },
      documents: documents || [],
      status: 'PENDING',
      amount: servicePrice,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      customer_address,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: application, error: applicationError } = await supabaseAdmin
      .from('applications')
      .insert(applicationData)
      .select(`
        id,
        form_data,
        documents,
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

    // Note: Payment processing will happen after admin approval for some, or immediate for others depending on logic
    // The current logic seems to be: Create Transaction immediately as "Payment for [Service]"

    // Create transaction record
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'SCHEME_PAYMENT',
        amount: servicePrice,
        status: 'COMPLETED',
        description: `Payment for ${service.name}`,
        reference: application.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: `${service.name} application submitted successfully`,
      application_id: application.id,
      amount_charged: servicePrice,
      status: 'PENDING'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
