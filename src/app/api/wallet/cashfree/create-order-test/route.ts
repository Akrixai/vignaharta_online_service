import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase';

// Use TEST credentials from environment variables
const CASHFREE_APP_ID_TEST = process.env.CASHFREE_APP_ID_TEST || process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY_TEST = process.env.CASHFREE_SECRET_KEY_TEST || process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_API_URL_TEST = 'https://sandbox.cashfree.com/pg';

// POST /api/wallet/cashfree/create-order-test - Create Cashfree TEST order for wallet recharge
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user?.email) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { amount } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const baseAmount = parseFloat(amount);

        // Validate amount range
        if (baseAmount < 10) {
            return NextResponse.json({ error: 'Minimum amount is ₹10' }, { status: 400 });
        }

        const gstPercentage = 2.00; // 2% GST
        const gstAmount = Math.round((baseAmount * gstPercentage)) / 100;
        const totalAmount = parseFloat((baseAmount + gstAmount).toFixed(2));

        if (baseAmount > 50000) {
            return NextResponse.json({
                error: 'Maximum amount is ₹50,000 per transaction',
                max_amount: 50000
            }, { status: 400 });
        }

        // Get user from database
        const { data: dbUser } = await supabaseAdmin
            .from('users')
            .select('id, name, email, phone')
            .eq('email', user.email)
            .single();

        if (!dbUser) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Generate unique order ID
        const orderId = `WALLET_TEST_${dbUser.id.toString().substring(0, 8)}_${Date.now()}`;

        // Create Cashfree order with TEST credentials
        const orderRequest = {
            order_id: orderId,
            order_amount: totalAmount,
            order_currency: 'INR',
            customer_details: {
                customer_id: dbUser.id.toString(),
                customer_name: dbUser.name || 'User',
                customer_email: dbUser.email,
                customer_phone: dbUser.phone || '9999999999',
            },
            order_meta: {
                return_url: `${process.env.NEXTAUTH_URL}/dashboard/wallet?payment=success`,
                notify_url: `${process.env.NEXTAUTH_URL}/api/wallet/cashfree/webhook`,
            },
            order_note: `TEST - Wallet recharge - Base: ₹${baseAmount.toFixed(2)}, GST (2%): ₹${gstAmount.toFixed(2)}`,
        };

        const cashfreeResponse = await fetch(`${CASHFREE_API_URL_TEST}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': CASHFREE_APP_ID_TEST,
                'x-client-secret': CASHFREE_SECRET_KEY_TEST,
            },
            body: JSON.stringify(orderRequest),
        });

        const response = await cashfreeResponse.json();

        // DEBUG: Log the exact response from Cashfree
        console.log('Cashfree API Response:', JSON.stringify(response, null, 2));

        if (!cashfreeResponse.ok || !response) {
            console.error('Cashfree TEST API error:', {
                status: cashfreeResponse.status,
                statusText: cashfreeResponse.statusText,
                response,
            });

            let errorMessage = response?.message || `Cashfree API error: ${cashfreeResponse.statusText}`;

            return NextResponse.json({
                error: errorMessage,
                details: response,
            }, { status: 500 });
        }

        // Store payment record in database
        const { error: dbError } = await supabaseAdmin
            .from('cashfree_payments')
            .insert({
                user_id: dbUser.id,
                order_id: orderId,
                cf_order_id: response.cf_order_id,
                amount: totalAmount,
                base_amount: baseAmount,
                gst_percentage: gstPercentage,
                gst_amount: gstAmount,
                wallet_credit_amount: baseAmount,
                currency: 'INR',
                status: 'CREATED',
                payment_session_id: response.payment_session_id,
                metadata: {
                    base_amount: baseAmount,
                    gst_percentage: gstPercentage,
                    gst_amount: gstAmount,
                    total_amount: totalAmount,
                    wallet_credit_amount: baseAmount,
                    test_mode: true,
                },
            });

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json({ error: 'Failed to save payment record' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                order_id: orderId,
                cf_order_id: response.cf_order_id,
                payment_session_id: response.payment_session_id,
                base_amount: baseAmount,
                gst_amount: gstAmount,
                total_amount: totalAmount,
                wallet_credit_amount: baseAmount,
                test_mode: true,
            }
        });
    } catch (error: any) {
        console.error('Error creating Cashfree TEST order:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error',
        }, { status: 500 });
    }
}
