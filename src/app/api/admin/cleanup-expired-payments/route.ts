import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Add CORS headers for cross-origin requests
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// POST /api/admin/cleanup-expired-payments - Cleanup expired payments (can be called by cron)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (expectedSecret && cronSecret !== expectedSecret) {
      return addCorsHeaders(NextResponse.json({ error: 'Invalid cron secret' }, { status: 401 }));
    }

    console.log('Starting cleanup of expired payments...');

    // Mark wallet payments older than 2 hours as expired
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data: expiredWalletPayments, error: walletError } = await supabaseAdmin
      .from('cashfree_payments')
      .select('order_id, created_at')
      .eq('status', 'CREATED')
      .lt('created_at', twoHoursAgo);

    if (walletError) {
      console.error('Error fetching expired wallet payments:', walletError);
      return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch expired payments' }, { status: 500 }));
    }

    let walletPaymentsUpdated = 0;
    if (expiredWalletPayments && expiredWalletPayments.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('cashfree_payments')
        .update({
          status: 'FAILED',
          webhook_data: {
            auto_expired: true,
            expired_at: new Date().toISOString(),
            reason: 'Payment expired (older than 2 hours)',
            cleanup_job: true
          },
        })
        .eq('status', 'CREATED')
        .lt('created_at', twoHoursAgo);

      if (updateError) {
        console.error('Error updating expired wallet payments:', updateError);
      } else {
        walletPaymentsUpdated = expiredWalletPayments.length;
        console.log(`Marked ${walletPaymentsUpdated} expired wallet payments as failed`);
      }
    }

    // Mark registration payments older than 2 hours as expired
    const { data: expiredRegistrationPayments, error: registrationError } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .select('order_id, created_at')
      .eq('status', 'CREATED')
      .lt('created_at', twoHoursAgo);

    if (registrationError) {
      console.error('Error fetching expired registration payments:', registrationError);
      return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch expired registration payments' }, { status: 500 }));
    }

    let registrationPaymentsUpdated = 0;
    if (expiredRegistrationPayments && expiredRegistrationPayments.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('cashfree_registration_payments')
        .update({
          status: 'FAILED',
          webhook_data: {
            auto_expired: true,
            expired_at: new Date().toISOString(),
            reason: 'Registration payment expired (older than 2 hours)',
            cleanup_job: true
          },
        })
        .eq('status', 'CREATED')
        .lt('created_at', twoHoursAgo);

      if (updateError) {
        console.error('Error updating expired registration payments:', updateError);
      } else {
        registrationPaymentsUpdated = expiredRegistrationPayments.length;
        console.log(`Marked ${registrationPaymentsUpdated} expired registration payments as failed`);
      }
    }

    const totalUpdated = walletPaymentsUpdated + registrationPaymentsUpdated;
    
    console.log(`Cleanup completed. Total payments marked as expired: ${totalUpdated}`);

    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      wallet_payments_expired: walletPaymentsUpdated,
      registration_payments_expired: registrationPaymentsUpdated,
      total_expired: totalUpdated,
      cutoff_time: twoHoursAgo
    }));
  } catch (error: any) {
    console.error('Cleanup expired payments error:', error);
    return addCorsHeaders(NextResponse.json({
      error: error.message || 'Cleanup failed',
    }, { status: 500 }));
  }
}