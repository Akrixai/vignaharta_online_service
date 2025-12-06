import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// POST - Scratch a cashback (can only be done once)
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user || user.role !== UserRole.CUSTOMER) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { transaction_id } = body;

        if (!transaction_id) {
            return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
        }

        // Get the transaction
        const { data: transaction, error: fetchError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('id', transaction_id)
            .eq('user_id', user.id)
            .eq('type', 'CASHBACK')
            .single();

        if (fetchError || !transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Check if already scratched
        if (transaction.metadata?.scratched === true) {
            return NextResponse.json({
                error: 'This cashback has already been scratched',
                scratched: true
            }, { status: 400 });
        }

        // Mark as scratched
        const { error: updateError } = await supabaseAdmin
            .from('transactions')
            .update({
                metadata: {
                    ...transaction.metadata,
                    scratched: true,
                    scratched_at: new Date().toISOString()
                }
            })
            .eq('id', transaction_id);

        if (updateError) {
            console.error('Error scratching cashback:', updateError);
            return NextResponse.json({ error: 'Failed to scratch cashback' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Cashback scratched successfully!',
            amount: transaction.amount,
            scratched_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Scratch cashback API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
