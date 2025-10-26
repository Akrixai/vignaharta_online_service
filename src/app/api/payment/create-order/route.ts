import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Razorpay from 'razorpay';

// Initialize Razorpay only when needed to avoid build errors
let razorpay: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpay) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
      throw new Error('Razorpay credentials are not configured');
    }
    
    razorpay = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpay;
}

// POST /api/payment/create-order - Create Razorpay order
export async function POST(request: NextRequest) {
  try {
    // Initialize Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency = 'INR' } = body;

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum amount is ₹1' },
        { status: 400 }
      );
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Generate short receipt ID (max 40 chars)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const userIdShort = session.user.id.slice(-8); // Last 8 chars of user ID
    const receipt = `pay_${userIdShort}_${timestamp}`; // Format: pay_12345678_87654321
    
    const options = {
      amount: amountInPaise,
      currency,
      receipt: receipt,
      notes: {
        user_id: session.user.id,
        user_email: session.user.email,
        purpose: 'wallet_topup'
      }
    };

    const order = await razorpayInstance.orders.create(options);

    return NextResponse.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}