import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', authUser.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      opid,
      number,
      mobile,
      opt1,
      opt2,
      opt3,
      opt4,
      opt5,
      opt6,
      opt7,
      opt9,
      opt10,
    } = body;

    if (!opid || !number || !mobile) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: opid, number, mobile' },
        { status: 400 }
      );
    }

    // First check if operator supports bill fetch
    const operatorDetails = await kwikapi.getOperatorDetails(opid);

    if (!operatorDetails.success || operatorDetails.data.bill_fetch !== 'YES') {
      return NextResponse.json(
        { success: false, message: 'Bill fetch not supported for this operator' },
        { status: 400 }
      );
    }

    // Fetch bill details
    const billResponse = await kwikapi.fetchBill({
      number,
      amount: '10', // Dummy amount
      opid,
      mobile,
      opt1,
      opt2,
      opt3,
      opt4,
      opt5,
      opt6,
      opt7,
      opt9,
      opt10,
    });

    if (billResponse.success) {
      // Store bill fetch history
      await supabase.from('bill_fetch_history').insert({
        user_id: user.id,
        operator_id: opid,
        consumer_number: number,
        consumer_name: billResponse.data.customer_name,
        bill_amount: billResponse.data.due_amount,
        due_amount: billResponse.data.due_amount,
        bill_month: billResponse.data.bill_period,
        due_date: billResponse.data.due_date,
        bill_data: billResponse.data,
      });

      return NextResponse.json({
        success: true,
        data: {
          customer_name: billResponse.data.customer_name,
          due_amount: billResponse.data.due_amount,
          due_date: billResponse.data.due_date,
          bill_number: billResponse.data.bill_number,
          bill_date: billResponse.data.bill_date,
          bill_period: billResponse.data.bill_period,
          ref_id: billResponse.data.ref_id,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: billResponse.data?.message || 'Bill fetch failed' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Bill Fetch API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
