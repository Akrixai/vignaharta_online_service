import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch pending registrations with associated payment requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Get pending registrations
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (regError) {
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }

    // Get associated wallet requests for manual payments
    const registrationIds = registrations?.map(reg => reg.id) || [];
    
    let walletRequests = [];
    if (registrationIds.length > 0) {
      const { data: requests, error: walletError } = await supabaseAdmin
        .from('wallet_requests')
        .select('*')
        .contains('metadata', { registration_type: 'RETAILER' })
        .in('metadata->pending_registration_id', registrationIds)
        .order('created_at', { ascending: false });

      if (!walletError) {
        walletRequests = requests || [];
      }
    }

    // Combine registrations with their payment requests
    const registrationsWithPayments = registrations?.map(registration => {
      const associatedPayment = walletRequests.find(req => 
        req.metadata?.pending_registration_id === registration.id
      );

      return {
        ...registration,
        payment_request: associatedPayment || null,
        has_manual_payment: !!associatedPayment,
        payment_type: associatedPayment ? 'MANUAL_QR' : 'CASHFREE_GATEWAY'
      };
    }) || [];

    return NextResponse.json({
      success: true,
      registrations: registrationsWithPayments
    });

  } catch (error) {
    console.error('Error fetching registrations with payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}