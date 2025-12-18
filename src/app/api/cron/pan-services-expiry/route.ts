import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Cron Job: PAN Services Expiry Handler
 * 
 * This endpoint checks for PAN services that have expired (24 hours without completion)
 * and processes automatic refunds for users.
 * 
 * Schedule: Runs every hour via Vercel Cron
 * Security: Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      console.error('❌ Unauthorized cron job access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Starting PAN services expiry check...', new Date().toISOString());

    // Find expired PAN services (24 hours old, still pending/processing, payment debited, not refunded)
    const { data: expiredServices, error: findError } = await supabaseAdmin
      .from('pan_services')
      .select('*')
      .in('status', ['PENDING', 'PROCESSING'])
      .eq('payment_status', 'DEBITED')
      .eq('refund_processed', false)
      .lt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (findError) {
      console.error('❌ Error finding expired services:', findError);
      return NextResponse.json({ 
        success: false, 
        error: findError.message 
      }, { status: 500 });
    }

    if (!expiredServices || expiredServices.length === 0) {
      console.log('✅ No expired services found');
      return NextResponse.json({ 
        success: true, 
        message: 'No expired services to process',
        processed: 0,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📋 Found ${expiredServices.length} expired services to process`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const service of expiredServices) {
      try {
        console.log(`\n🔄 Processing expired service: ${service.order_id}`);
        console.log(`   User: ${service.user_id}`);
        console.log(`   Amount: ₹${service.amount}`);
        console.log(`   Expired at: ${service.expires_at}`);

        // Get user wallet
        const { data: wallet, error: walletError } = await supabaseAdmin
          .from('wallets')
          .select('*')
          .eq('user_id', service.user_id)
          .single();

        if (walletError || !wallet) {
          console.error(`❌ Wallet not found for user: ${service.user_id}`, walletError);
          errorCount++;
          results.push({
            order_id: service.order_id,
            user_id: service.user_id,
            status: 'error',
            error: 'Wallet not found'
          });
          continue;
        }

        const oldBalance = wallet.balance;
        const newBalance = oldBalance + service.amount;

        // Refund the amount
        const { error: refundWalletError } = await supabaseAdmin
          .from('wallets')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', service.user_id);

        if (refundWalletError) {
          console.error(`❌ Error refunding wallet for ${service.order_id}:`, refundWalletError);
          errorCount++;
          results.push({
            order_id: service.order_id,
            user_id: service.user_id,
            status: 'error',
            error: 'Wallet refund failed'
          });
          continue;
        }

        console.log(`   💰 Refunded: ₹${service.amount} (${oldBalance} → ${newBalance})`);

        // Create refund transaction
        const { data: refundTransaction, error: refundTxError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: service.user_id,
            wallet_id: wallet.id,
            type: 'REFUND',
            amount: service.amount,
            status: 'COMPLETED',
            description: `PAN Service Refund - Expired (${service.order_id})`,
            reference: service.order_id,
            metadata: {
              service_type: service.service_type,
              pan_service_id: service.id,
              reason: 'Application expired after 24 hours',
              expired_at: service.expires_at,
              processed_by: 'cron_job',
              auto_refund: true
            }
          })
          .select()
          .single();

        if (refundTxError) {
          console.error(`❌ Error creating refund transaction for ${service.order_id}:`, refundTxError);
          // Continue anyway as wallet was already refunded
        } else {
          console.log(`   ✅ Refund transaction created: ${refundTransaction.id}`);
        }

        // Update PAN service status
        const { error: updateError } = await supabaseAdmin
          .from('pan_services')
          .update({
            status: 'EXPIRED',
            payment_status: 'REFUNDED',
            refund_processed: true,
            refund_processed_at: new Date().toISOString(),
            refund_transaction_id: refundTransaction?.id,
            error_message: 'Application expired after 24 hours without completion',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', service.id);

        if (updateError) {
          console.error(`❌ Error updating PAN service ${service.order_id}:`, updateError);
          errorCount++;
          results.push({
            order_id: service.order_id,
            user_id: service.user_id,
            amount: service.amount,
            status: 'partial_error',
            error: 'Service update failed but refund processed'
          });
        } else {
          console.log(`   ✅ Service status updated to EXPIRED`);
          successCount++;
          results.push({
            order_id: service.order_id,
            user_id: service.user_id,
            amount: service.amount,
            service_type: service.service_type,
            status: 'refunded',
            refund_transaction_id: refundTransaction?.id
          });
        }

      } catch (error) {
        console.error(`💥 Exception processing service ${service.order_id}:`, error);
        errorCount++;
        results.push({
          order_id: service.order_id,
          user_id: service.user_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const summary = {
      success: true,
      message: `Processed ${expiredServices.length} expired services`,
      timestamp: new Date().toISOString(),
      total_found: expiredServices.length,
      success_count: successCount,
      error_count: errorCount,
      results
    };

    console.log('\n📊 Expiry Check Summary:');
    console.log(`   Total found: ${expiredServices.length}`);
    console.log(`   Successfully processed: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('✅ Expiry check completed\n');

    return NextResponse.json(summary);

  } catch (error) {
    console.error('💥 Fatal error in expiry cron:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also support POST for testing
export async function POST(request: NextRequest) {
  return GET(request);
}
