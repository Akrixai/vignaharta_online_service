/**
 * Fix PAN Card Wallet Deduction Script
 * 
 * This script identifies and fixes successful PAN card applications
 * that have payment_status = 'RESERVED' but were never charged from the wallet.
 * 
 * Issue: Some successful PAN cards show status = 'SUCCESS' but payment_status = 'RESERVED'
 * meaning the wallet was never debited for the successful service.
 * 
 * Solution: 
 * 1. Find all successful PAN cards with payment_status = 'RESERVED'
 * 2. Debit the wallet amount
 * 3. Create the missing WITHDRAWAL transaction
 * 4. Update payment_status to 'CHARGED'
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPanWalletDeductions() {
  try {
    console.log('🔍 Starting PAN wallet deduction fix...\n');

    // Step 1: Find successful PAN cards with RESERVED payment status
    const { data: unreservedPanCards, error: findError } = await supabase
      .from('pan_services')
      .select(`
        id,
        order_id,
        user_id,
        service_type,
        amount,
        acknowledgement_number,
        created_at,
        completed_at,
        users!pan_services_user_id_fkey(email, name)
      `)
      .eq('status', 'SUCCESS')
      .eq('payment_status', 'RESERVED');

    if (findError) {
      console.error('❌ Error finding unreserved PAN cards:', findError);
      return;
    }

    if (!unreservedPanCards || unreservedPanCards.length === 0) {
      console.log('✅ No successful PAN cards found with RESERVED payment status');
      return;
    }

    console.log(`📋 Found ${unreservedPanCards.length} successful PAN card(s) with RESERVED payment status:`);
    
    for (const panCard of unreservedPanCards) {
      console.log(`\n🔸 Order: ${panCard.order_id}`);
      console.log(`   User: ${panCard.users.email} (${panCard.users.name})`);
      console.log(`   Amount: ₹${panCard.amount}`);
      console.log(`   Service: ${panCard.service_type}`);
      console.log(`   Completed: ${panCard.completed_at}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔧 PROCESSING WALLET DEDUCTIONS...');
    console.log('='.repeat(60));

    let successCount = 0;
    let errorCount = 0;

    for (const panCard of unreservedPanCards) {
      try {
        console.log(`\n🔄 Processing ${panCard.order_id}...`);

        // Step 2: Get current wallet balance
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', panCard.user_id)
          .single();

        if (walletError || !wallet) {
          console.error(`❌ Wallet not found for user ${panCard.user_id}:`, walletError);
          errorCount++;
          continue;
        }

        const oldBalance = parseFloat(wallet.balance);
        const deductionAmount = parseFloat(panCard.amount);
        const newBalance = oldBalance - deductionAmount;

        console.log(`   💰 Current balance: ₹${oldBalance}`);
        console.log(`   💸 Deduction amount: ₹${deductionAmount}`);
        console.log(`   💰 New balance: ₹${newBalance}`);

        // Step 3: Check if transaction already exists (safety check)
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('reference', panCard.order_id)
          .eq('type', 'WITHDRAWAL')
          .eq('status', 'COMPLETED')
          .maybeSingle();

        if (existingTransaction) {
          console.log(`   ⚠️  WITHDRAWAL transaction already exists - skipping`);
          continue;
        }

        // Step 4: Debit wallet
        const { error: walletUpdateError } = await supabase
          .from('wallets')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', panCard.user_id);

        if (walletUpdateError) {
          console.error(`   ❌ Failed to update wallet:`, walletUpdateError);
          errorCount++;
          continue;
        }

        console.log(`   ✅ Wallet debited successfully`);

        // Step 5: Create WITHDRAWAL transaction
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: panCard.user_id,
            type: 'WITHDRAWAL',
            amount: deductionAmount,
            status: 'COMPLETED',
            reference: panCard.order_id,
            description: `PAN Service Payment - ${panCard.service_type}`,
            metadata: {
              pan_service_id: panCard.id,
              service_type: panCard.service_type,
              acknowledgement_number: panCard.acknowledgement_number,
              previous_balance: oldBalance,
              new_balance: newBalance,
              fixed_by_script: true,
              fix_timestamp: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (transactionError) {
          console.error(`   ❌ Failed to create transaction:`, transactionError);
          
          // Rollback wallet update
          await supabase
            .from('wallets')
            .update({
              balance: oldBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', panCard.user_id);
          
          console.log(`   🔄 Wallet balance rolled back`);
          errorCount++;
          continue;
        }

        console.log(`   ✅ Transaction created: ${transaction.id}`);

        // Step 6: Update PAN service payment status
        const { error: panUpdateError } = await supabase
          .from('pan_services')
          .update({
            payment_status: 'CHARGED',
            payment_debited_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', panCard.id);

        if (panUpdateError) {
          console.error(`   ❌ Failed to update PAN service:`, panUpdateError);
          errorCount++;
          continue;
        }

        console.log(`   ✅ PAN service updated to CHARGED status`);
        console.log(`   🎉 Successfully processed ${panCard.order_id}`);
        
        successCount++;

      } catch (error) {
        console.error(`❌ Error processing ${panCard.order_id}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total found: ${unreservedPanCards.length}`);

    if (successCount > 0) {
      console.log('\n🎉 Wallet deductions have been fixed for successful PAN cards!');
      console.log('💡 All successful PAN cards now have proper wallet deductions and transaction records.');
    }

  } catch (error) {
    console.error('❌ Script execution error:', error);
  }
}

// Run the script
if (require.main === module) {
  fixPanWalletDeductions()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixPanWalletDeductions };