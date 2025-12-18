# PAN Services InsPay Flow Implementation

## Overview
This document outlines the implementation of the InsPay-style flow for PAN services where wallet deduction happens instantly upon redirect, with real-time webhook status updates and automatic refund handling.

## Current vs New Flow

### Current Flow (To be Changed)
1. User enters mobile number and clicks "Start Application"
2. System checks wallet balance but doesn't deduct
3. User redirects to InsPay
4. Wallet deduction happens only on success callback
5. No 24-hour incomplete tracking
6. No automatic refunds

### New Flow (InsPay Style)
1. User enters mobile number and clicks "Start Application"
2. **Instant wallet deduction** of service amount
3. Create PAN service record with status "PENDING"
4. Redirect user to InsPay URL
5. Order ID visible in PAN service history immediately
6. **Real-time webhook updates** change status
7. **24-hour tracking** for incomplete applications
8. **Automatic refund** on failure or 24-hour expiry

## Database Schema Updates

### 1. Add New Fields to `pan_services` Table

```sql
-- Migration: Update PAN services for InsPay flow
ALTER TABLE pan_services
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PENDING' 
  CHECK (payment_status IN ('PENDING', 'DEBITED', 'REFUNDED')),
ADD COLUMN IF NOT EXISTS payment_debited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_transaction_id UUID REFERENCES transactions(id),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS callback_data JSONB DEFAULT '{}'::jsonb;

-- Add index for expiry tracking
CREATE INDEX IF NOT EXISTS idx_pan_services_expires_at 
  ON pan_services(expires_at) 
  WHERE status = 'PENDING' AND payment_status = 'DEBITED';

-- Add index for webhook tracking
CREATE INDEX IF NOT EXISTS idx_pan_services_inspay_txid 
  ON pan_services(inspay_txid) 
  WHERE inspay_txid IS NOT NULL;
```

### 2. Status Flow

```
PENDING (Initial) → PROCESSING (InsPay URL generated) → SUCCESS/FAILURE (Webhook)
                 ↓
              EXPIRED (24 hours, no webhook)
```

### 3. Payment Status Flow

```
PENDING (Initial) → DEBITED (Instant deduction) → REFUNDED (On failure/expiry)
```

## API Implementation Changes

### 1. New PAN Application API (`/api/pan-services/new-pan`)

**Changes Required:**

```typescript
// BEFORE: Check balance only
if (wallet.balance < config.price) {
  return error;
}

// AFTER: Instant deduction
const { data: updatedWallet, error: deductError } = await supabaseAdmin
  .from('wallets')
  .update({
    balance: wallet.balance - config.price,
    updated_at: new Date().toISOString()
  })
  .eq('user_id', session.user.id)
  .select()
  .single();

if (deductError) {
  return NextResponse.json({ 
    success: false, 
    message: 'Failed to process payment' 
  }, { status: 500 });
}

// Create debit transaction immediately
const { data: debitTransaction } = await supabaseAdmin
  .from('transactions')
  .insert({
    user_id: session.user.id,
    wallet_id: wallet.id,
    type: 'WITHDRAWAL',
    amount: -config.price,
    status: 'COMPLETED',
    description: `PAN Service Payment - ${service_type} (${orderId})`,
    reference: orderId,
    metadata: {
      service_type: 'NEW_PAN',
      order_id: orderId,
      payment_type: 'INSTANT_DEBIT'
    }
  })
  .select()
  .single();

// Create PAN service record with payment info
const { data: panService } = await supabaseAdmin
  .from('pan_services')
  .insert({
    user_id: session.user.id,
    service_type: 'NEW_PAN',
    mobile_number,
    mode,
    order_id: orderId,
    amount: config.price,
    commission_amount: (config.price * config.commission_rate) / 100,
    status: 'PENDING',
    payment_status: 'DEBITED',
    payment_debited_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  })
  .select()
  .single();
```

### 2. Webhook/Callback API (`/api/pan-services/callback`)

**Complete Rewrite:**

```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txid = searchParams.get('txid');
    const status = searchParams.get('status');
    const opid = searchParams.get('opid');

    console.log('📞 PAN Webhook received:', { txid, status, opid });

    if (!txid || !status) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Find PAN service by inspay_txid
    const { data: panService, error: findError } = await supabaseAdmin
      .from('pan_services')
      .select('*')
      .eq('inspay_txid', txid)
      .single();

    if (findError || !panService) {
      console.error('❌ PAN service not found for txid:', txid);
      return NextResponse.json({ 
        success: false, 
        message: 'PAN service record not found' 
      }, { status: 404 });
    }

    // Prevent duplicate webhook processing
    if (panService.status !== 'PENDING' && panService.status !== 'PROCESSING') {
      console.log('⚠️ Webhook already processed for txid:', txid);
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook already processed' 
      });
    }

    const updateData: any = {
      webhook_received_at: new Date().toISOString(),
      callback_data: { txid, status, opid, received_at: new Date().toISOString() },
      updated_at: new Date().toISOString()
    };

    if (opid) {
      updateData.inspay_opid = opid;
    }

    // Handle SUCCESS
    if (status.toLowerCase() === 'success') {
      console.log('✅ PAN Service SUCCESS');
      
      updateData.status = 'SUCCESS';
      
      // Add commission to wallet
      if (panService.commission_amount > 0) {
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('*')
          .eq('user_id', panService.user_id)
          .single();

        if (wallet) {
          await supabaseAdmin
            .from('wallets')
            .update({
              balance: wallet.balance + panService.commission_amount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', panService.user_id);

          // Create commission transaction
          await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: panService.user_id,
              wallet_id: wallet.id,
              type: 'COMMISSION',
              amount: panService.commission_amount,
              status: 'COMPLETED',
              description: `PAN Service Commission - ${panService.service_type} (${panService.order_id})`,
              reference: panService.order_id,
              metadata: {
                service_type: panService.service_type,
                pan_service_id: panService.id,
                inspay_txid: txid,
                inspay_opid: opid
              }
            });
        }
      }
    } 
    // Handle FAILURE
    else {
      console.log('❌ PAN Service FAILURE - Processing refund');
      
      updateData.status = 'FAILURE';
      updateData.error_message = `Transaction failed with status: ${status}`;
      
      // Process refund
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', panService.user_id)
        .single();

      if (wallet && panService.payment_status === 'DEBITED') {
        // Refund the amount
        await supabaseAdmin
          .from('wallets')
          .update({
            balance: wallet.balance + panService.amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', panService.user_id);

        // Create refund transaction
        const { data: refundTransaction } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: panService.user_id,
            wallet_id: wallet.id,
            type: 'REFUND',
            amount: panService.amount,
            status: 'COMPLETED',
            description: `PAN Service Refund - ${panService.service_type} (${panService.order_id})`,
            reference: panService.order_id,
            metadata: {
              service_type: panService.service_type,
              pan_service_id: panService.id,
              inspay_txid: txid,
              reason: 'Service failed'
            }
          })
          .select()
          .single();

        updateData.payment_status = 'REFUNDED';
        updateData.refund_processed = true;
        updateData.refund_processed_at = new Date().toISOString();
        updateData.refund_transaction_id = refundTransaction?.id;
      }
    }

    // Update PAN service record
    const { error: updateError } = await supabaseAdmin
      .from('pan_services')
      .update(updateData)
      .eq('id', panService.id);

    if (updateError) {
      console.error('❌ Error updating PAN service:', updateError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update PAN service' 
      }, { status: 500 });
    }

    console.log('✅ Webhook processed successfully');

    return NextResponse.json({
      success: true,
      message: `PAN service ${updateData.status} processed`,
      data: {
        txid,
        status: updateData.status,
        order_id: panService.order_id,
        refund_processed: updateData.refund_processed || false
      }
    });

  } catch (error) {
    console.error('💥 Error in PAN webhook:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
```

### 3. New Cron Job API (`/api/cron/pan-services-expiry`)

**Purpose:** Check for expired PAN services (24 hours) and process refunds

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Running PAN services expiry check...');

    // Find expired PAN services (24 hours old, still pending, payment debited)
    const { data: expiredServices, error: findError } = await supabaseAdmin
      .from('pan_services')
      .select('*')
      .eq('status', 'PENDING')
      .eq('payment_status', 'DEBITED')
      .eq('refund_processed', false)
      .lt('expires_at', new Date().toISOString());

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
        message: 'No expired services',
        processed: 0
      });
    }

    console.log(`📋 Found ${expiredServices.length} expired services`);

    const results = [];

    for (const service of expiredServices) {
      try {
        // Get user wallet
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('*')
          .eq('user_id', service.user_id)
          .single();

        if (!wallet) {
          console.error(`❌ Wallet not found for user: ${service.user_id}`);
          continue;
        }

        // Refund the amount
        await supabaseAdmin
          .from('wallets')
          .update({
            balance: wallet.balance + service.amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', service.user_id);

        // Create refund transaction
        const { data: refundTransaction } = await supabaseAdmin
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
              reason: 'Application expired after 24 hours'
            }
          })
          .select()
          .single();

        // Update PAN service status
        await supabaseAdmin
          .from('pan_services')
          .update({
            status: 'EXPIRED',
            payment_status: 'REFUNDED',
            refund_processed: true,
            refund_processed_at: new Date().toISOString(),
            refund_transaction_id: refundTransaction?.id,
            error_message: 'Application expired after 24 hours without completion',
            updated_at: new Date().toISOString()
          })
          .eq('id', service.id);

        console.log(`✅ Processed refund for service: ${service.order_id}`);
        
        results.push({
          order_id: service.order_id,
          user_id: service.user_id,
          amount: service.amount,
          status: 'refunded'
        });

      } catch (error) {
        console.error(`❌ Error processing service ${service.order_id}:`, error);
        results.push({
          order_id: service.order_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Processed ${results.length} expired services`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} expired services`,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('💥 Error in expiry cron:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
```

## Frontend Updates

### 1. PAN Services History Page

**Show Order ID and Real-time Status:**

```typescript
// Add status badge component
const StatusBadge = ({ status, paymentStatus }: { status: string; paymentStatus: string }) => {
  const getStatusColor = () => {
    if (status === 'SUCCESS') return 'bg-green-100 text-green-800';
    if (status === 'FAILURE' || status === 'EXPIRED') return 'bg-red-100 text-red-800';
    if (status === 'PROCESSING') return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = () => {
    if (status === 'PENDING' && paymentStatus === 'DEBITED') {
      return 'Payment Debited - Awaiting Completion';
    }
    return status;
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
      {getStatusText()}
    </span>
  );
};

// Display order ID prominently
<div className="font-mono text-sm text-gray-600">
  Order ID: {service.order_id}
</div>

// Show payment status
{service.payment_status === 'DEBITED' && service.status === 'PENDING' && (
  <div className="text-sm text-orange-600">
    ⏳ Payment debited. Complete within 24 hours or auto-refund will be processed.
  </div>
)}

// Show refund info
{service.refund_processed && (
  <div className="text-sm text-green-600">
    ✅ Refund processed: ₹{service.amount}
  </div>
)}
```

### 2. New PAN Application Page

**Update Success Message:**

```typescript
if (data.success) {
  toast.success('Payment debited successfully! Redirecting to complete your application...');
  
  // Show order ID
  console.log('Order ID:', data.data.order_id);
  
  // Redirect to InsPay URL
  if (data.data.inspay_url) {
    window.location.href = data.data.inspay_url;
  }
}
```

## Cron Job Setup

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/pan-services-expiry",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour to check for expired services.

### Environment Variable

Add to `.env`:

```env
CRON_SECRET=your_secure_random_string_here
```

## Testing Checklist

### 1. Instant Deduction Flow
- [ ] User with sufficient balance can start application
- [ ] Wallet balance deducted immediately
- [ ] Debit transaction created
- [ ] PAN service record created with DEBITED status
- [ ] User redirected to InsPay URL

### 2. Success Webhook
- [ ] Webhook updates status to SUCCESS
- [ ] Commission added to wallet
- [ ] Commission transaction created
- [ ] No refund processed

### 3. Failure Webhook
- [ ] Webhook updates status to FAILURE
- [ ] Full refund processed
- [ ] Refund transaction created
- [ ] Payment status changed to REFUNDED

### 4. 24-Hour Expiry
- [ ] Cron job finds expired services
- [ ] Refund processed automatically
- [ ] Status changed to EXPIRED
- [ ] Refund transaction created

### 5. History Display
- [ ] Order ID visible immediately
- [ ] Status updates in real-time
- [ ] Payment status shown correctly
- [ ] Refund information displayed

## Security Considerations

1. **Cron Job Protection**: Use CRON_SECRET to prevent unauthorized access
2. **Webhook Validation**: Verify webhook authenticity (consider adding signature validation)
3. **Duplicate Prevention**: Check status before processing webhooks
4. **Transaction Atomicity**: Use database transactions for wallet updates
5. **Audit Trail**: Log all payment and refund operations

## Monitoring and Alerts

### Key Metrics to Track:
1. Total PAN applications initiated
2. Success rate
3. Failure rate
4. Expired applications (24-hour timeout)
5. Refund processing time
6. Webhook delivery success rate

### Alert Conditions:
1. High failure rate (>20%)
2. Webhook not received within 30 minutes
3. Refund processing failures
4. Wallet balance discrepancies

## Migration Steps

1. **Backup Database**: Take full backup before migration
2. **Run Migration**: Execute database schema updates
3. **Deploy API Changes**: Update all API routes
4. **Update Frontend**: Deploy frontend changes
5. **Configure Cron**: Set up Vercel cron job
6. **Test Thoroughly**: Run through all test scenarios
7. **Monitor**: Watch logs for first 24 hours

## Rollback Plan

If issues occur:
1. Disable cron job immediately
2. Revert API changes
3. Process any pending refunds manually
4. Restore previous version
5. Investigate and fix issues
6. Re-deploy with fixes

## Support Documentation

### For Users:
- Explain instant deduction
- Show order ID tracking
- Explain 24-hour completion window
- Describe automatic refund process

### For Support Team:
- How to check PAN service status
- How to manually process refunds
- How to investigate webhook issues
- How to handle user complaints

## Next Steps

1. Create database migration file
2. Update API routes (new-pan, pan-correction, incomplete-pan)
3. Create cron job API
4. Update frontend components
5. Add comprehensive logging
6. Set up monitoring
7. Test in staging environment
8. Deploy to production
9. Monitor for 48 hours
10. Document any issues and resolutions
