/**
 * Comprehensive PAN Wallet Deduction Fix Script
 * 
 * This script identifies and fixes PAN services where:
 * 1. Status is SUCCESS and payment_status is CHARGED
 * 2. But NO wallet deduction transaction exists
 * 3. Or wallet balance wasn't actually updated
 * 
 * Run with: node scripts/fix-pan-wallet-deduction-comprehensive.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 Starting comprehensive PAN wallet deduction audit...\n');

  try {
    // Step 1: Find PAN services that are SUCCESS + CHARGED but missing transaction
    console.log('📊 Step 1: Finding PAN services with missing transactions...');
    
    const { data: orphanedServices, error: orphanError } = await supabase
      .from('pan_services')
      .select(`
        *,
        user:users!pan_services_user_id_fkey(id, email, name, role),
        wallet:wallets!inner(id, balance)
      `)
      .eq('status', 'SUCCESS')
      .eq('payment_status', 'CHARGED')
      .order('payment_charged_at', { ascending: false });

    if (orphanError) {
      throw orphanError;
    }

    console.log(`Found ${orphanedServices.length} SUCCESS + CHARGED PAN services\n`);

    // Check each one for missing transaction
    const issues = [];
    
    for (const service of orphanedServices) {
      // Check if transaction exists
      const { data: transaction } = await supabase
        .from('transactions')
        .select('id, amount, status, created_at, metadata')
        .eq('reference', service.order_id)
        .eq('type', 'WITHDRAWAL')
        .eq('status', 'COMPLETED')
        .maybeSingle();

      if (!transaction) {
        issues.push({
          type: 'MISSING_TRANSACTION',
          service,
          transaction: null
        });
        console.log(`❌ ISSUE: ${service.order_id} - Missing transaction record`);
      } else {
        // Transaction exists, verify wallet was actually debited
        const recordedNewBalance = transaction.metadata?.new_balance;
        const recordedPrevBalance = transaction.metadata?.previous_balance;
        
        if (recordedNewBalance && recordedPrevBalance) {
          const expectedNewBalance = parseFloat(recordedPrevBalance) - parseFloat(transaction.amount);
          const actualNewBalance = parseFloat(recordedNewBalance);
          
          if (Math.abs(expectedNewBalance - actualNewBalance) > 0.01) {
            issues.push({
              type: 'BALANCE_MISMATCH',
              service,
              transaction,
              expectedNewBalance,
              actualNewBalance
            });
            console.log(`⚠️  ISSUE: ${service.order_id} - Balance calculation mismatch`);
          }
        }
      }
    }

    console.log(`\n📊 Audit Summary:`);
    console.log(`   Total PAN services checked: ${orphanedServices.length}`);
    console.log(`   Issues found: ${issues.length}`);
    console.log(`   - Missing transactions: ${issues.filter(i => i.type === 'MISSING_TRANSACTION').length}`);
    console.log(`   - Balance mismatches: ${issues.filter(i => i.type === 'BALANCE_MISMATCH').length}\n`);

    if (issues.length === 0) {
      console.log('✅ No issues found! All PAN services have correct wallet deductions.\n');
      return;
    }

    // Step 2: Fix the issues
    console.log('🔧 Step 2: Fixing identified issues...\n');

    for (const issue of issues) {
      if (issue.type === 'MISSING_TRANSACTION') {
        await fixMissingTransaction(issue.service);
      } else if (issue.type === 'BALANCE_MISMATCH') {
        console.log(`⚠️  Skipping balance mismatch for ${issue.service.order_id} - Manual review needed`);
      }
    }

    console.log('\n✅ Fix script completed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function fixMissingTransaction(service) {
  try {
    console.log(`\n🔧 Fixing ${service.order_id}...`);
    
    // Get current wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', service.user_id)
      .single();

    if (!wallet) {
      console.log(`   ❌ Wallet not found for user ${service.user_id}`);
      return;
    }

    const amountToDeduct = parseFloat(service.amount);
    const currentBalance = parseFloat(wallet.balance);
    const newBalance = currentBalance - amountToDeduct;

    console.log(`   💰 Current balance: ₹${currentBalance}`);
    console.log(`   💸 Amount to deduct: ₹${amountToDeduct}`);
    console.log(`   💰 New balance: ₹${newBalance}`);

    // Check if wallet has sufficient balance
    if (newBalance < -1000) {
      console.log(`   ⚠️  WARNING: Deduction would result in negative balance (${newBalance})`);
      console.log(`   ⏭️  Skipping - Manual review required`);
      return;
    }

    // Update wallet balance
    const { error: walletError } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (walletError) {
      console.log(`   ❌ Failed to update wallet:`, walletError.message);
      return;
    }

    console.log(`   ✅ Wallet balance updated`);

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: service.user_id,
        wallet_id: wallet.id,
        type: 'WITHDRAWAL',
        amount: amountToDeduct,
        status: 'COMPLETED',
        description: `Payment for ${getServiceTypeName(service.service_type)} application - ${service.order_id} (Recovered)`,
        reference: service.order_id,
        metadata: {
          pan_service_id: service.id,
          service_type: service.service_type,
          mobile_number: service.mobile_number,
          payment_mode: service.mode,
          acknowledgement_number: service.acknowledgement_number,
          previous_balance: currentBalance,
          new_balance: newBalance,
          recovered_transaction: true,
          recovered_at: new Date().toISOString()
        },
        created_at: service.payment_charged_at || service.updated_at
      })
      .select()
      .single();

    if (txError) {
      console.log(`   ❌ Failed to create transaction:`, txError.message);
      // Rollback wallet update
      await supabase
        .from('wallets')
        .update({ balance: currentBalance })
        .eq('id', wallet.id);
      console.log(`   ↩️  Rolled back wallet update`);
      return;
    }

    console.log(`   ✅ Transaction record created: ${transaction.id}`);
    console.log(`   ✅ Successfully fixed ${service.order_id}`);

  } catch (error) {
    console.error(`   ❌ Error fixing ${service.order_id}:`, error.message);
  }
}

function getServiceTypeName(serviceType) {
  const names = {
    'NEW_PAN': 'New PAN',
    'PAN_CORRECTION': 'PAN Correction',
    'INCOMPLETE_PAN': 'Incomplete PAN'
  };
  return names[serviceType] || serviceType;
}

// Run the script
main().catch(console.error);
