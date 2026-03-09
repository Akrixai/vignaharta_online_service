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

export async function POST(request: NextRequest) {
  try {
    // Initialize Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        error: 'Valid amount is required' 
      }, { status: 400 });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(parseFloat(amount) * 100);

    if (amountInPaise < 100) { // Minimum 1 rupee
      return NextResponse.json({ 
        error: 'Minimum amount is ₹1' 
      }, { status: 400 });
    }

    // Create Razorpay order
    // Generate short receipt ID (max 40 chars)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const userIdShort = session.user.id.slice(-8); // Last 8 chars of user ID
    const receipt = `wlt_${userIdShort}_${timestamp}`; // Format: wlt_12345678_87654321
    
    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      notes: {
        user_id: session.user.id,
        user_name: session.user.name,
        user_email: session.user.email,
        purpose: 'wallet_topup'
      }
    };

    const order = await razorpayInstance.orders.create(orderOptions);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    
    // Handle specific Razorpay errors
    if (error instanceof Error) {
      if (error.message.includes('key_id')) {
        return NextResponse.json({ 
          error: 'Payment gateway configuration error. Please contact support.' 
        }, { status: 500 });
      }
      
      if (error.message.includes('key_secret')) {
        return NextResponse.json({ 
          error: 'Payment gateway authentication error. Please contact support.' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to create payment order. Please try again.' 
    }, { status: 500 });
  }
}