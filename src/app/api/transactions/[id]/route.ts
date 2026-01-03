import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get authenticated user
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const transactionId = params.id;

        // Fetch transaction from recharge_transactions table with operator details
        const { data: transaction, error } = await supabase
            .from('recharge_transactions')
            .select(`
                *,
                operator:recharge_operators(operator_name)
            `)
            .eq('id', transactionId)
            .eq('user_id', user.id) // Ensure user can only access their own transactions
            .single();

        if (error || !transaction) {
            console.error('Error fetching transaction:', error);
            return NextResponse.json(
                { success: false, message: 'Transaction not found' },
                { status: 404 }
            );
        }

        // Format the transaction data for the receipt
        const formattedTransaction = {
            id: transaction.id,
            operator_name: transaction.operator?.operator_name || transaction.kwikapi_provider || 'N/A',
            operator_ref: transaction.kwikapi_opr_id || transaction.operator_transaction_id || 'N/A',
            consumer_number: transaction.consumer_number || 'N/A',
            customer_name: transaction.account_holder_name || 'N/A',
            customer_mobile: transaction.mobile_number || 'N/A',
            amount: transaction.amount,
            bill_details: transaction.bill_details || {},
            status: transaction.status,
            created_at: transaction.created_at,
        };

        return NextResponse.json({
            success: true,
            transaction: formattedTransaction,
        });
    } catch (error: any) {
        console.error('Error in transaction endpoint:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
