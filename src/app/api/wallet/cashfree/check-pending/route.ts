import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
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

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || 'TEST';
const CASHFREE_API_URL = CASHFREE_ENVIRONMENT === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// POST /api/wallet/cashfree/check-pending - Check and process pending payments
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    console.log('Checking pending payments for user:', user.id);

    // Get pending payments for this user (created in last 6 hours)
    // Cashfree test orders typically expire within a few hours
    const { data: pendingPayments, error: paymentsError } = await supabaseAdmin
      .from('cashfree_payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'CREATED')
      .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Last 6 hours
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching pending payments:', paymentsError);
      return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch pending payments' }, { status: 500 }));
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      return addCorsHeaders(NextResponse.json({ 
        success: true, 
        message: 'No pending payments found',
        verified_payments: 0
      }));
    }

    console.log(`Found ${pendingPayments.length} pending payments to check`);

    let verifiedCount = 0;
    const results = [];

    // Check each pending payment
    for (const payment of pendingPayments) {
      try {
        console.log(`Checking payment status for order: ${payment.order_id}`);

        // Check if cf_order_id exists
        if (!payment.cf_order_id) {
          console.error(`Missing cf_order_id for payment: ${payment.order_id}`);
          results.push({
            order_id: payment.order_id,
            status: 'MISSING_CF_ORDER_ID',
            error: 'Missing Cashfree order ID'
          });
          continue;
        }

        // Check payment status with Cashfree API using cf_order_id
        console.log(`Querying Cashfree API with cf_order_id: ${payment.cf_order_id} for order: ${payment.order_id}`);
        
        const cashfreeResponse = await fetch(`${CASHFREE_API_URL}/orders/${payment.cf_order_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-version': '2023-08-01',
            'x-client-id': CASHFREE_APP_ID,
            'x-client-secret': CASHFREE_SECRET_KEY,
          },
        });

        const orderStatus = await cashfreeResponse.json();

        if (!cashfreeResponse.ok) {
          console.error(`Cashfree API error for ${payment.order_id}:`, orderStatus);
          
          // If order not found and payment is older than 2 hours, mark as expired/failed
          const paymentAge = Date.now() - new Date(payment.created_at).getTime();
          const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
          
          if (orderStatus.code === 'order_not_found' && paymentAge > twoHours) {
            console.log(`Marking old payment as expired: ${payment.order_id} (age: ${Math.round(paymentAge / (60 * 1000))} minutes)`);
            
            // Mark payment as expired/failed
            await supabaseAdmin
              .from('cashfree_payments')
              .update({
                status: 'FAILED',
                webhook_data: {
                  ...orderStatus,
                  auto_expired: true,
                  expired_at: new Date().toISOString(),
                  reason: 'Order not found in Cashfree API (likely expired)'
                },
              })
              .eq('order_id', payment.order_id);
            
            results.push({
              order_id: payment.order_id,
              status: 'EXPIRED',
              reason: 'Order not found (expired)'
            });
          } else {
            results.push({
              order_id: payment.order_id,
              status: 'API_ERROR',
              error: orderStatus
            });
          }
          continue;
        }

        console.log(`Order ${payment.order_id} status:`, orderStatus.order_status);

        // Check if payment is successful - but don't process it here, let webhook handle it
        if (orderStatus.order_status === 'PAID') {
          console.log(`Payment ${payment.order_id} is PAID but not processed here - webhook should handle it`);
          results.push({
            order_id: payment.order_id,
            status: 'PAID_AWAITING_WEBHOOK',
            cashfree_status: orderStatus.order_status,
            message: 'Payment successful, awaiting webhook processing'
          });
        } else if (orderStatus.order_status === 'CANCELLED' || orderStatus.order_status === 'FAILED') {
          // Update payment status to failed
          await supabaseAdmin
            .from('cashfree_payments')
            .update({
              status: 'FAILED',
              webhook_data: orderStatus,
            })
            .eq('order_id', payment.order_id);

          results.push({
            order_id: payment.order_id,
            status: 'FAILED',
            cashfree_status: orderStatus.order_status
          });

          console.log(`Payment ${payment.order_id} marked as failed. Cashfree status: ${orderStatus.order_status}`);
        } else {
          results.push({
            order_id: payment.order_id,
            status: 'PENDING',
            cashfree_status: orderStatus.order_status
          });

          console.log(`Payment ${payment.order_id} still pending. Cashfree status: ${orderStatus.order_status}`);
        }
      } catch (error) {
        console.error(`Error processing payment ${payment.order_id}:`, error);
        results.push({
          order_id: payment.order_id,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Processed ${pendingPayments.length} payments. Verified: ${verifiedCount}`);

    return addCorsHeaders(NextResponse.json({ 
      success: true, 
      message: `Checked ${pendingPayments.length} pending payments. Verified: ${verifiedCount}`,
      verified_payments: verifiedCount,
      total_checked: pendingPayments.length,
      results: results
    }));
  } catch (error: any) {
    console.error('Check pending payments error:', error);
    return addCorsHeaders(NextResponse.json({
      error: error.message || 'Failed to check pending payments',
    }, { status: 500 }));
  }
}