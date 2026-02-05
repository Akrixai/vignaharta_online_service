# KwikAPI Callback Issue Analysis and Fix

## Problem Analysis

### Issue Description
Transaction `TXN_1770203204159_ya2g9iw` shows as SUCCESS on KwikAPI dashboard but remains PENDING in our system, with no money deducted from user wallet.

### Root Cause
1. **Missing Callback URL Configuration**: KwikAPI dashboard needs to be configured with callback URLs to send real-time transaction status updates
2. **No Callback Received**: The transaction shows `callback_received: false` indicating no webhook was received
3. **No Settlement**: Since no callback was received, the transaction settlement (wallet deduction + commission) never occurred

### Current Transaction Status
```sql
-- Transaction Details
ID: cd137761-a21c-426a-aefd-7ce874b828cf
User: SHREE SOMNATH SAINIK OFFICE (9407fb8d-a828-4472-88aa-b6e29af7b170)
Amount: ₹299.00
Status: PENDING
Callback Received: false
Wallet Balance: ₹321.01 (money not deducted)
```

## Solution Implementation

### 1. Configure KwikAPI Dashboard Callback URLs

KwikAPI dashboard needs to be configured with these callback URLs:

**Primary Callback URL:**
```
https://www.vighnahartaonlineservices.in/api/kwikapi-callback
```

**Backup Callback URL:**
```
https://www.vighnahartaonlineservices.in/api/callback
```

### 2. Manual Transaction Recovery Script

Create a script to manually process successful transactions that missed callbacks:

```javascript
// scripts/recover-missed-callbacks.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function recoverTransaction(transactionId, newStatus = 'SUCCESS') {
  try {
    // Get transaction details
    const { data: transaction } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name, role)')
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      console.error('Transaction not found:', transactionId);
      return;
    }

    console.log('Processing transaction recovery:', {
      id: transaction.id,
      ref: transaction.transaction_ref,
      amount: transaction.amount,
      currentStatus: transaction.status
    });

    // Update transaction status
    await supabase
      .from('recharge_transactions')
      .update({
        status: newStatus,
        callback_received: true,
        callback_data: { manual_recovery: true, recovered_at: new Date().toISOString() },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    // Process settlement if SUCCESS
    if (newStatus === 'SUCCESS') {
      await processTransactionSuccess(transaction);
    }

    console.log('✅ Transaction recovered successfully:', transaction.id);
  } catch (error) {
    console.error('❌ Recovery failed:', error);
  }
}

async function processTransactionSuccess(transaction) {
  const user = transaction.user;
  if (!user) return;

  // Get current wallet balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', transaction.user_id)
    .single();

  if (!wallet) return;

  // Get operator configuration
  const { data: rechargeOperator } = await supabase
    .from('recharge_operators')
    .select('*')
    .eq('id', transaction.operator_id)
    .single();

  const amountToDeduct = parseFloat(transaction.amount);
  let rewardAmount = 0;
  let rewardType = '';
  let rewardDescription = '';

  // Calculate reward
  if (user.role === 'CUSTOMER') {
    if (rechargeOperator?.cashback_enabled && !transaction.cashback_claimed) {
      const cashbackAmount = parseFloat(transaction.cashback_amount || 0);
      if (cashbackAmount > 0) {
        rewardAmount = cashbackAmount;
      } else {
        const minPercentage = parseFloat(rechargeOperator.cashback_min_percentage || 0.5);
        const maxPercentage = parseFloat(rechargeOperator.cashback_max_percentage || 2.0);
        const randomPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
        rewardAmount = (amountToDeduct * randomPercentage) / 100;

        await supabase
          .from('recharge_transactions')
          .update({
            cashback_percentage: randomPercentage,
            cashback_amount: rewardAmount,
          })
          .eq('id', transaction.id);
      }
      rewardType = 'REFUND';
      rewardDescription = `Cashback for ${transaction.service_type} recharge`;
    }
  } else {
    if (!transaction.commission_paid) {
      const commissionAmount = parseFloat(transaction.commission_amount || 0);
      if (commissionAmount > 0) {
        rewardAmount = commissionAmount;
      } else {
        const commissionRate = parseFloat(rechargeOperator?.commission_rate || 2.0);
        rewardAmount = (amountToDeduct * commissionRate) / 100;

        await supabase
          .from('recharge_transactions')
          .update({ commission_amount: rewardAmount })
          .eq('id', transaction.id);
      }
      rewardType = 'COMMISSION';
      rewardDescription = `Commission for ${transaction.service_type} recharge`;
    }
  }

  // Update wallet atomically: Deduct amount AND Add reward
  const finalBalanceChange = -amountToDeduct + rewardAmount;

  await supabase
    .from('wallets')
    .update({ balance: parseFloat(wallet.balance) + finalBalanceChange })
    .eq('user_id', transaction.user_id);

  // Record transactions in ledger
  // Record Withdrawal
  await supabase.from('transactions').insert({
    user_id: transaction.user_id,
    wallet_id: wallet.id,
    type: 'WITHDRAWAL',
    amount: amountToDeduct,
    status: 'COMPLETED',
    description: `${transaction.service_type} Recharge ${transaction.mobile_number || transaction.dth_number || transaction.consumer_number}`,
    reference: transaction.transaction_ref,
    metadata: { recharge_transaction_id: transaction.id, manual_recovery: true },
  });

  // Record Reward if any
  if (rewardAmount > 0) {
    await supabase.from('transactions').insert({
      user_id: transaction.user_id,
      wallet_id: wallet.id,
      type: rewardType,
      amount: rewardAmount,
      status: 'COMPLETED',
      description: rewardDescription,
      reference: transaction.transaction_ref,
      metadata: { recharge_transaction_id: transaction.id, manual_recovery: true },
    });

    // Mark reward as paid/claimed
    await supabase
      .from('recharge_transactions')
      .update({
        [user.role === 'CUSTOMER' ? 'cashback_claimed' : 'commission_paid']: true,
        [user.role === 'CUSTOMER' ? 'cashback_claimed_at' : 'commission_paid_at']: new Date().toISOString(),
      })
      .eq('id', transaction.id);
  }

  console.log(`✅ Settlement completed for ${transaction.id}:`, {
    deducted: amountToDeduct,
    reward: rewardAmount,
    finalChange: finalBalanceChange
  });
}

// Usage
recoverTransaction('cd137761-a21c-426a-aefd-7ce874b828cf', 'SUCCESS');
```

### 3. Enhanced Callback Endpoint

Update the callback endpoint to handle missing transactions better:

```typescript
// Add to src/app/api/kwikapi-callback/route.ts
export async function POST(request: NextRequest) {
  try {
    // ... existing code ...

    // If transaction not found by kwikapi_order_id, try by transaction_ref
    if (!transaction) {
      const { data: refTransaction } = await supabase
        .from('recharge_transactions')
        .select('*, user:users(id, email, name, role)')
        .eq('transaction_ref', kwikApiOrderId)
        .single();
      transaction = refTransaction;
    }

    // If still not found, log for manual investigation
    if (!transaction) {
      console.error('❌ [KwikAPI] Transaction not found for callback:', {
        kwikApiOrderId,
        transactionStatus,
        callbackData: data
      });
      
      // Store orphaned callback for manual processing
      await supabase.from('orphaned_callbacks').insert({
        kwikapi_order_id: kwikApiOrderId,
        status: transactionStatus,
        callback_data: data,
        received_at: new Date().toISOString()
      });

      return new NextResponse('TRANSACTION_NOT_FOUND', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // ... rest of existing code ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

### 4. Transaction Status Check API

Create an API to manually check transaction status with KwikAPI:

```typescript
// src/app/api/admin/check-transaction-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { transaction_id } = await request.json();

    // Get transaction details
    const { data: transaction } = await supabase
      .from('recharge_transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (!transaction) {
      return NextResponse.json({ success: false, message: 'Transaction not found' });
    }

    // Check status with KwikAPI
    const statusResponse = await kwikapi.getTransactionStatus(
      transaction.kwikapi_order_id || transaction.transaction_ref
    );

    return NextResponse.json({
      success: true,
      data: {
        local_status: transaction.status,
        kwikapi_status: statusResponse.data?.status,
        kwikapi_response: statusResponse.data
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
```

## Immediate Action Required

### 1. Configure KwikAPI Dashboard
Contact KwikAPI support to configure callback URLs:
- Primary: `https://www.vighnahartaonlineservices.in/api/kwikapi-callback`
- Backup: `https://www.vighnahartaonlineservices.in/api/callback`

### 2. Recover Current Transaction
Run the recovery script for the specific transaction:
```bash
node scripts/recover-missed-callbacks.js
```

### 3. Monitor for Similar Issues
Check for other PENDING transactions that might be SUCCESS on KwikAPI:
```sql
SELECT * FROM recharge_transactions 
WHERE status = 'PENDING' 
AND created_at > NOW() - INTERVAL '7 days'
AND callback_received = false
ORDER BY created_at DESC;
```

## Prevention Measures

### 1. Add Callback URL to API Calls
Some KwikAPI integrations support callback URL in the request:
```typescript
// Add to kwikapi.ts recharge methods
const queryParams = {
  // ... existing params ...
  callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/kwikapi-callback`
};
```

### 2. Implement Status Polling
For critical transactions, implement periodic status checking:
```typescript
// Check transaction status every 5 minutes for PENDING transactions
setInterval(async () => {
  const { data: pendingTransactions } = await supabase
    .from('recharge_transactions')
    .select('*')
    .eq('status', 'PENDING')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  for (const transaction of pendingTransactions) {
    // Check status with KwikAPI and update if needed
  }
}, 5 * 60 * 1000);
```

### 3. Add Transaction Timeout
Automatically mark transactions as FAILED after 24 hours if no callback received:
```sql
-- Add to cron job
UPDATE recharge_transactions 
SET status = 'FAILED', 
    error_message = 'Transaction timeout - no callback received'
WHERE status = 'PENDING' 
AND created_at < NOW() - INTERVAL '24 hours'
AND callback_received = false;
```

## Testing Callback URLs

Test callback endpoints:
```bash
# Test primary callback
curl -X POST https://www.vighnahartaonlineservices.in/api/kwikapi-callback \
  -H "Content-Type: application/json" \
  -d '{"payid":"TEST123","status":"SUCCESS","operator_ref":"OP123"}'

# Test backup callback  
curl -X POST https://www.vighnahartaonlineservices.in/api/callback \
  -H "Content-Type: application/json" \
  -d '{"order_id":"TEST123","status":"SUCCESS","txid":"OP123"}'
```

Both should return "SUCCESS" response.