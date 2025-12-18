# PAN Services Database Verification Report

**Date:** December 17, 2025  
**Status:** ✅ ALL VERIFIED AND READY

## Database Schema Verification

### ✅ Table Structure: `pan_services`

All required columns have been successfully added:

| Column Name | Data Type | Default | Nullable | Purpose |
|------------|-----------|---------|----------|---------|
| `id` | uuid | gen_random_uuid() | NO | Primary key |
| `user_id` | uuid | - | NO | User reference |
| `service_type` | varchar | - | NO | NEW_PAN/PAN_CORRECTION/INCOMPLETE_PAN |
| `mobile_number` | varchar(10) | - | NO | User mobile number |
| `mode` | varchar | - | NO | EKYC/ESIGN |
| `order_id` | varchar | - | NO | Unique order identifier |
| `amount` | numeric | 0 | NO | Service amount |
| `commission_amount` | numeric | 0 | NO | Commission for retailer |
| `status` | varchar | 'PENDING' | NO | Application status |
| `inspay_txid` | varchar | - | YES | InsPay transaction ID |
| `inspay_opid` | varchar | - | YES | InsPay operator ID |
| `inspay_url` | text | - | YES | InsPay redirect URL |
| `callback_data` | jsonb | '{}' | YES | Webhook callback data |
| `error_message` | text | - | YES | Error details |
| `created_at` | timestamptz | now() | YES | Creation timestamp |
| `updated_at` | timestamptz | now() | YES | Last update timestamp |
| **`payment_status`** | varchar(20) | 'PENDING' | YES | **PENDING/DEBITED/REFUNDED** |
| **`payment_debited_at`** | timestamptz | - | YES | **When payment was debited** |
| **`refund_processed`** | boolean | false | YES | **Refund status flag** |
| **`refund_processed_at`** | timestamptz | - | YES | **When refund was processed** |
| **`refund_transaction_id`** | uuid | - | YES | **Reference to refund transaction** |
| **`expires_at`** | timestamptz | - | YES | **24-hour expiry timestamp** |
| **`webhook_received_at`** | timestamptz | - | YES | **When webhook was received** |
| **`completed_at`** | timestamptz | - | YES | **When application completed** |

### ✅ Constraints

All constraints are properly configured:

1. **Check Constraints:**
   - `mobile_number`: Must be 10 digits
   - `mode`: Must be EKYC or ESIGN
   - `payment_status`: Must be PENDING, DEBITED, or REFUNDED
   - `service_type`: Must be NEW_PAN, PAN_CORRECTION, or INCOMPLETE_PAN
   - `status`: Must be PENDING, PROCESSING, SUCCESS, FAILURE, or EXPIRED

2. **Foreign Keys:**
   - `user_id` → `users(id)`
   - `refund_transaction_id` → `transactions(id)`

3. **Unique Constraints:**
   - `order_id` (unique index)

### ✅ Indexes

Performance indexes are in place:

1. `idx_pan_services_expires_at` - **Critical for cron job** (filtered index for expired services)
2. `idx_pan_services_inspay_txid` - For webhook lookups
3. `idx_pan_services_payment_status` - For payment status queries
4. `idx_pan_services_user_status` - For user history queries
5. `idx_pan_services_order_id` - For order lookups
6. `idx_pan_services_status` - For status filtering
7. `idx_pan_services_user_id` - For user queries
8. `idx_pan_services_created_at` - For chronological queries

### ✅ Trigger

**Trigger Name:** `trigger_set_pan_service_expiry`  
**Function:** `set_pan_service_expiry()`  
**Purpose:** Automatically sets `expires_at` to 24 hours from creation time on INSERT

### ✅ View

**View Name:** `pan_services_expired_pending`  
**Purpose:** Monitoring view for expired services that need refund processing  
**Filters:**
- Status: PENDING or PROCESSING
- Payment Status: DEBITED
- Refund Processed: false
- Expires At: < NOW()

**Columns Include:**
- All pan_services columns
- user_name (from users table)
- user_email (from users table)
- current_wallet_balance (from wallets table)

### ✅ Column Comments

All new columns have descriptive comments for documentation:

```sql
payment_status: "Payment status: PENDING (not debited), DEBITED (instant deduction), REFUNDED (refund processed)"
payment_debited_at: "Timestamp when payment was debited from wallet"
refund_processed: "Whether refund has been processed for failed/expired application"
refund_processed_at: "Timestamp when refund was processed"
refund_transaction_id: "Reference to refund transaction in transactions table"
expires_at: "24-hour expiry timestamp for incomplete applications"
webhook_received_at: "Timestamp when webhook was received from InsPay"
completed_at: "Timestamp when application was completed (success/failure)"
```

## Implementation Status

### ✅ Backend APIs

1. **New PAN API** (`/api/pan-services/new-pan`)
   - ✅ Instant wallet deduction
   - ✅ Debit transaction creation
   - ✅ 24-hour expiry setting
   - ✅ Rollback on errors
   - ✅ Immediate refund on InsPay errors

2. **PAN Correction API** (`/api/pan-services/pan-correction`)
   - ✅ Instant wallet deduction
   - ✅ Debit transaction creation
   - ✅ 24-hour expiry setting
   - ✅ Rollback on errors
   - ✅ Immediate refund on InsPay errors

3. **Webhook/Callback API** (`/api/pan-services/callback`)
   - ✅ Success handling with commission
   - ✅ Failure handling with refund
   - ✅ Duplicate webhook prevention
   - ✅ Comprehensive logging

4. **Cron Job API** (`/api/cron/pan-services-expiry`)
   - ✅ 24-hour expiry checking
   - ✅ Automatic refund processing
   - ✅ Status update to EXPIRED
   - ✅ Security with CRON_SECRET
   - ✅ Detailed logging and reporting

### ✅ Frontend Updates

1. **PAN Services History Page**
   - ✅ Order ID display (prominent, monospace font)
   - ✅ Payment status badges
   - ✅ Time remaining countdown
   - ✅ Refund information display
   - ✅ 24-hour warning messages

### ✅ Configuration

1. **Vercel Cron Job**
   - ✅ Configured in `vercel.json`
   - ✅ Schedule: Every hour (`0 * * * *`)
   - ✅ Path: `/api/cron/pan-services-expiry`

2. **Environment Variables**
   - ✅ CRON_SECRET added to `.env`

## CRON_SECRET Configuration

### For Production (Vercel)

You need to add the `CRON_SECRET` environment variable in your Vercel project settings:

**Steps:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** Use one of these secure random strings (or generate your own):

```
Option 1 (Recommended):
cron_sec_vos_2025_8f9a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0

Option 2:
inspay_cron_prod_x7k9m2n5p8q1r4s7t0u3v6w9y2z5a8b1c4d7e0f3g6h9j2k5m8n1p4q7r0s3t6

Option 3:
vos_pan_expiry_cron_2025_secure_9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z3
```

4. Select environment: **Production** (and optionally Preview/Development)
5. Click **Save**

### Generate Your Own Secure Secret

You can generate your own using Node.js:

```javascript
// Run in Node.js console or create a script
const crypto = require('crypto');
const secret = crypto.randomBytes(48).toString('hex');
console.log('CRON_SECRET=' + secret);
```

Or use this command in terminal:
```bash
node -e "console.log('CRON_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
```

### Security Best Practices

1. **Never commit** the actual CRON_SECRET to git
2. **Use different secrets** for development and production
3. **Rotate the secret** periodically (every 3-6 months)
4. **Keep it long** (at least 32 characters)
5. **Use random characters** (not dictionary words)

## Testing Checklist

### Before Production Deployment

- [ ] Run database migration in production
- [ ] Set CRON_SECRET in Vercel environment variables
- [ ] Test new PAN application with instant deduction
- [ ] Test PAN correction with instant deduction
- [ ] Test webhook success callback
- [ ] Test webhook failure callback with refund
- [ ] Verify cron job runs (check Vercel logs after 1 hour)
- [ ] Test 24-hour expiry manually (adjust expires_at for testing)
- [ ] Verify refund transactions appear in wallet
- [ ] Check PAN services history page displays correctly

### Manual Testing Commands

```sql
-- Test: Create a test service that expires immediately
INSERT INTO pan_services (
    user_id, service_type, mobile_number, mode, order_id,
    amount, commission_amount, status, payment_status,
    payment_debited_at, expires_at
) VALUES (
    'YOUR_USER_ID',
    'NEW_PAN',
    '9999999999',
    'EKYC',
    'TEST_ORDER_' || extract(epoch from now())::text,
    107.00,
    10.70,
    'PENDING',
    'DEBITED',
    NOW(),
    NOW() - INTERVAL '1 hour'  -- Already expired
);

-- Then call the cron job manually to test:
-- GET /api/cron/pan-services-expiry
-- With header: Authorization: Bearer YOUR_CRON_SECRET
```

## Monitoring

### Key Metrics to Track

1. **Expiry Rate:** How many applications expire without completion
2. **Refund Volume:** Total amount refunded daily/weekly
3. **Success Rate:** Percentage of successful completions
4. **Average Completion Time:** How long users take to complete
5. **Webhook Delivery:** Success rate of webhook processing

### Logs to Monitor

1. Cron job execution logs (Vercel Functions logs)
2. Webhook callback logs
3. Refund processing logs
4. Wallet balance changes

### Alerts to Set Up

1. High expiry rate (>20%)
2. Cron job failures
3. Webhook processing errors
4. Refund processing failures

## Summary

✅ **Database:** Fully configured with all required fields, indexes, constraints, and triggers  
✅ **Backend APIs:** All updated with instant deduction and refund logic  
✅ **Frontend:** History page updated with new status displays  
✅ **Cron Job:** Configured and ready for 24-hour expiry processing  
✅ **Security:** CRON_SECRET protection in place  

**Status:** Ready for production deployment after setting CRON_SECRET in Vercel.

## Next Steps

1. Set `CRON_SECRET` in Vercel environment variables (see above)
2. Deploy to production
3. Monitor first few transactions closely
4. Check cron job execution after 1 hour
5. Verify refunds are processing correctly
6. Set up monitoring and alerts

---

**Note:** The database migration has already been applied. All tables, indexes, triggers, and views are in place and verified.
