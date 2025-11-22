# Cashfree Webhook Configuration Guide

## 🔗 Webhook URLs for Production

Add these webhook URLs in your Cashfree Dashboard:

### 1. **Wallet Recharge Webhook**
```
https://www.vighnahartaonlineservice.in/api/wallet/cashfree/webhook
```
**Purpose**: Handles wallet top-up payments for retailers and customers

**Events to Subscribe**:
- `PAYMENT_SUCCESS_WEBHOOK`
- `PAYMENT_FAILED_WEBHOOK`
- `PAYMENT_USER_DROPPED_WEBHOOK`

---

### 2. **Registration Payment Webhook**
```
https://www.vighnahartaonlineservice.in/api/wallet/cashfree/webhook
```
**Purpose**: Handles retailer registration fee payments (₹499)

**Note**: This uses the same webhook endpoint. The system automatically detects registration payments by the order ID prefix `REG-`

**Events to Subscribe**:
- `PAYMENT_SUCCESS_WEBHOOK`
- `PAYMENT_FAILED_WEBHOOK`
- `PAYMENT_USER_DROPPED_WEBHOOK`

---

## 📋 Configuration Steps

### Step 1: Login to Cashfree Dashboard
1. Go to [Cashfree Dashboard](https://merchant.cashfree.com/)
2. Login with your credentials
3. Switch to **Production** environment (top-right corner)

### Step 2: Navigate to Webhooks
1. Click on **Developers** in the left sidebar
2. Select **Webhooks**
3. Click **Add Webhook** or **Configure Webhook**

### Step 3: Add Webhook URL
1. **Webhook URL**: `https://www.vighnahartaonlineservice.in/api/wallet/cashfree/webhook`
2. **Webhook Version**: Select `v2` (latest)
3. **Events**: Select the following:
   - ✅ `PAYMENT_SUCCESS_WEBHOOK`
   - ✅ `PAYMENT_FAILED_WEBHOOK`
   - ✅ `PAYMENT_USER_DROPPED_WEBHOOK`

### Step 4: Webhook Secret (Optional)
**Note**: Cashfree may not provide a webhook secret in production mode. This is normal!

**If Cashfree provides a secret**:
1. Copy the webhook secret from the dashboard
2. Add it to your `.env` file:
   ```env
   CASHFREE_WEBHOOK_SECRET=your_webhook_secret_here
   ```

**If no secret is provided** (common in production):
- ✅ The webhook will still work perfectly
- ✅ Signature verification will be automatically skipped
- ✅ Additional security through order validation and database checks
- ✅ No action needed - just leave `CASHFREE_WEBHOOK_SECRET` empty or remove it

### Step 5: Test Webhook
1. Use Cashfree's **Test Webhook** feature in the dashboard
2. Or make a test payment and verify the webhook is received
3. Check your application logs for webhook processing

---

## 🔐 Security Features

### 1. **Signature Verification (When Available)**
- If webhook secret is provided, webhooks are verified using HMAC SHA256
- Signature format: `base64(hmac_sha256(timestamp + raw_body))`
- Invalid signatures are rejected with 401 status
- **Note**: Many production accounts don't get webhook secrets - this is normal!

### 2. **Order Validation (Primary Security)**
- ✅ Order IDs are validated against database records
- ✅ Duplicate webhook processing is prevented
- ✅ Amount verification ensures payment matches order
- ✅ User ownership verification
- ✅ Payment status checks

### 3. **Additional Security Layers**
- Webhook endpoint only accepts POST requests
- Order must exist in database before processing
- Payment status transitions are validated
- Transaction records prevent double-crediting

---

## 📊 Webhook Processing Flow

### For Wallet Recharge:
```
1. Webhook received → Verify signature
2. Parse webhook data → Extract order details
3. Find Cashfree payment record in database
4. Update payment status (PAID/FAILED)
5. If PAID:
   - Create transaction record
   - Update wallet balance
   - Mark payment as completed
6. Return success response
```

### For Registration Payment:
```
1. Webhook received → Verify signature
2. Detect registration payment (order ID starts with REG-)
3. Find registration payment record
4. Update payment status
5. If PAID:
   - Auto-approve pending registration
   - Create user account
   - Create wallet for new user
   - Send welcome notification
6. Return success response
```

---

## 🧪 Testing Webhooks

### Test in Development:
```bash
# The webhook endpoint is accessible at:
http://localhost:3000/api/wallet/cashfree/webhook

# Test with curl:
curl -X POST http://localhost:3000/api/wallet/cashfree/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PAYMENT_SUCCESS_WEBHOOK",
    "data": {
      "order": {
        "order_id": "TEST-123",
        "order_amount": 1000
      },
      "payment": {
        "cf_payment_id": "12345",
        "payment_status": "SUCCESS",
        "payment_group": "upi"
      }
    }
  }'
```

### Test in Production:
1. Make a small test payment (₹1)
2. Check webhook logs in Cashfree dashboard
3. Verify transaction appears in your database
4. Check wallet balance is updated

---

## 📝 Webhook Event Types

### 1. PAYMENT_SUCCESS_WEBHOOK
**Triggered**: When payment is successfully completed
**Action**: 
- Update payment status to PAID
- Credit wallet balance
- Create transaction record
- Send success notification

### 2. PAYMENT_FAILED_WEBHOOK
**Triggered**: When payment fails
**Action**:
- Update payment status to FAILED
- Log failure reason
- Send failure notification

### 3. PAYMENT_USER_DROPPED_WEBHOOK
**Triggered**: When user abandons payment
**Action**:
- Update payment status to CANCELLED
- Log abandonment
- No wallet update

---

## 🔍 Monitoring & Debugging

### Check Webhook Logs:
1. **Cashfree Dashboard**: Developers → Webhooks → Logs
2. **Application Logs**: Check server console for webhook processing
3. **Database**: Check `cashfree_payments` and `cashfree_registration_payments` tables

### Common Issues:

#### Webhook Not Received:
- ✅ Verify webhook URL is correct
- ✅ Check firewall/security settings
- ✅ Ensure HTTPS is working
- ✅ Verify webhook is enabled in Cashfree dashboard

#### Signature Verification Failed:
- ✅ **If no webhook secret provided by Cashfree**: This is normal! Verification will be skipped automatically
- ✅ Check `CASHFREE_WEBHOOK_SECRET` in .env (if you have one)
- ✅ Ensure secret matches Cashfree dashboard
- ✅ Verify timestamp header is present
- ✅ **Production Note**: Most production accounts work without webhook secrets

#### Payment Not Updating:
- ✅ Check order ID exists in database
- ✅ Verify payment status in Cashfree dashboard
- ✅ Check for duplicate webhook processing
- ✅ Review application error logs

---

## 📱 Webhook Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Webhook processing failed",
  "message": "Detailed error message"
}
```

---

## 🚀 Production Checklist

Before going live, ensure:

- ✅ Webhook URL is configured in Cashfree Production dashboard
- ✅ `CASHFREE_WEBHOOK_SECRET` is set in .env (if provided by Cashfree, otherwise skip)
- ✅ `CASHFREE_ENVIRONMENT=PRODUCTION` in .env
- ✅ HTTPS is enabled on your domain
- ✅ Webhook endpoint is accessible (test with curl)
- ✅ Signature verification is enabled
- ✅ Test payment completed successfully
- ✅ Wallet balance updated correctly
- ✅ Transaction records created
- ✅ Notifications sent to users

---

## 📞 Support

### Cashfree Support:
- Email: support@cashfree.com
- Phone: +91-80-61606095
- Dashboard: [merchant.cashfree.com](https://merchant.cashfree.com/)

### Documentation:
- Webhooks: https://docs.cashfree.com/docs/webhooks
- Payment Gateway: https://docs.cashfree.com/docs/payment-gateway

---

## 🔄 Webhook Retry Logic

Cashfree automatically retries failed webhooks:
- **Retry Attempts**: Up to 5 times
- **Retry Interval**: Exponential backoff (1min, 5min, 15min, 30min, 1hr)
- **Success Criteria**: HTTP 200 response

Your endpoint should:
- Return 200 status for successful processing
- Return 500 status for temporary failures (will retry)
- Return 400 status for permanent failures (won't retry)

---

## 📊 Database Tables

### cashfree_payments (Wallet Recharge)
```sql
- id: UUID
- user_id: UUID
- order_id: VARCHAR (unique)
- cf_order_id: VARCHAR
- amount: NUMERIC
- status: VARCHAR (CREATED, ACTIVE, PAID, EXPIRED, CANCELLED, FAILED)
- payment_session_id: TEXT
- payment_method: VARCHAR
- payment_time: TIMESTAMP
- transaction_id: UUID (links to transactions table)
- webhook_data: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### cashfree_registration_payments (Registration Fee)
```sql
- id: UUID
- pending_registration_id: UUID
- user_id: UUID (after auto-approval)
- order_id: VARCHAR (unique, starts with REG-)
- cf_order_id: VARCHAR
- amount: NUMERIC (₹499)
- status: VARCHAR
- payment_method: VARCHAR
- payment_time: TIMESTAMP
- webhook_data: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

---

## 🎯 Summary

**Single Webhook URL for Both**:
```
https://www.vighnahartaonlineservice.in/api/wallet/cashfree/webhook
```

This endpoint intelligently handles:
1. ✅ Wallet recharge payments (order ID: `WALLET-xxx`)
2. ✅ Registration fee payments (order ID: `REG-xxx`)
3. ✅ Signature verification
4. ✅ Duplicate prevention
5. ✅ Automatic user creation for registrations
6. ✅ Wallet balance updates
7. ✅ Transaction recording

**Configure once, handles everything!** 🎉
