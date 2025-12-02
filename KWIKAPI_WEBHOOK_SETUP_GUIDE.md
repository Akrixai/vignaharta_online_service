# KWIKAPI Webhook/Callback Configuration Guide

## 🎯 Overview

KWIKAPI sends real-time transaction status updates to your callback URL. This ensures you get instant notifications about transaction success, failure, or status changes.

---

## 📍 Your Callback URL

### Development
```
http://localhost:3000/api/recharge/callback
```

### Production
```
https://yourdomain.com/api/recharge/callback
```

**⚠️ Important:** Replace `yourdomain.com` with your actual production domain.

---

## 🔧 How to Configure in KWIKAPI Dashboard

### Step 1: Login to KWIKAPI Dashboard
1. Go to https://kwikapi.com
2. Login with your credentials
3. Navigate to **Settings** or **API Configuration**

### Step 2: Add Callback URL
1. Look for **Webhook URL** or **Callback URL** section
2. Enter your callback URL:
   - **Development:** `http://localhost:3000/api/recharge/callback`
   - **Production:** `https://yourdomain.com/api/recharge/callback`
3. Save the configuration

### Step 3: Enable Webhooks
1. Enable webhook notifications for:
   - ✅ Prepaid Recharge
   - ✅ Postpaid Bill Payment
   - ✅ DTH Recharge
   - ✅ Electricity Bill Payment
2. Save settings

### Step 4: Test Webhook (Optional)
1. KWIKAPI may provide a "Test Webhook" button
2. Click it to send a test notification
3. Check your application logs to verify receipt

---

## 📨 Webhook Payload Structure

KWIKAPI will POST this data to your callback URL:

```json
{
  "transaction_id": "KWK_1234567890",
  "operator_txn_id": "OP_9876543210",
  "service": "PREPAID_RECHARGE",
  "amount": 499,
  "status": "SUCCESS",
  "created_at": "2025-12-01T19:31:00Z",
  "completed_at": "2025-12-01T19:31:45Z",
  "operator": "VODAFONE IDEA",
  "mobile_number": "9999999999",
  "signature": "hash_for_verification"
}
```

### Payload Fields

| Field | Type | Description |
|-------|------|-------------|
| transaction_id | string | KWIKAPI transaction ID |
| operator_txn_id | string | Operator's transaction ID |
| service | string | Service type (PREPAID_RECHARGE, POSTPAID, DTH, ELECTRICITY) |
| amount | number | Transaction amount |
| status | string | Transaction status (SUCCESS, FAILED, PENDING) |
| created_at | string | Transaction creation timestamp |
| completed_at | string | Transaction completion timestamp |
| operator | string | Operator name |
| mobile_number | string | Mobile/DTH/Consumer number |
| signature | string | Security signature for verification |

---

## 🔐 Webhook Security

### Signature Verification (Recommended)

KWIKAPI includes a signature in the webhook payload for security. Verify it to ensure the webhook is genuine:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: any, signature: string): boolean {
  const secret = process.env.KWIKAPI_WEBHOOK_SECRET!;
  const data = JSON.stringify(payload);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
  
  return hash === signature;
}
```

**Note:** Get your webhook secret from KWIKAPI dashboard and add it to `.env`:
```env
KWIKAPI_WEBHOOK_SECRET="your_webhook_secret_here"
```

### IP Whitelisting (Optional)

For additional security, whitelist KWIKAPI's IP addresses:
- Contact KWIKAPI support for their IP ranges
- Configure your firewall/server to only accept webhooks from these IPs

---

## 🔄 What Our Callback Handler Does

The callback handler at `/api/recharge/callback` automatically:

### 1. Receives Webhook
- Accepts POST requests from KWIKAPI
- Validates the payload structure

### 2. Finds Transaction
- Looks up transaction by `transaction_id`
- Verifies transaction exists in database

### 3. Updates Transaction Status
- Updates status (SUCCESS, FAILED, PENDING)
- Stores operator transaction ID
- Records callback data
- Sets completion timestamp

### 4. Handles Commission (on SUCCESS)
- Credits commission to user wallet
- Creates commission transaction record
- Updates wallet balance

### 5. Handles Refund (on FAILED)
- Refunds full amount to user wallet
- Creates refund transaction record
- Updates wallet balance

### 6. Sends Response
- Returns success confirmation to KWIKAPI
- Logs any errors for debugging

---

## 📊 Transaction Status Flow

```
PENDING → Processing by KWIKAPI
    ↓
SUCCESS → Commission credited to wallet
    ↓
    OR
    ↓
FAILED → Full refund to wallet
```

### Status Meanings

| Status | Description | Action Taken |
|--------|-------------|--------------|
| PENDING | Transaction initiated, waiting for operator | No action yet |
| SUCCESS | Transaction completed successfully | Commission credited |
| FAILED | Transaction failed at operator | Full refund issued |
| REFUNDED | Manual refund processed | Amount returned |

---

## 🧪 Testing Webhooks

### Method 1: Use KWIKAPI Test Environment

1. Set up test API key in `.env`:
```env
KWIKAPI_API_KEY="test_api_key_here"
```

2. Process a test transaction
3. KWIKAPI will send webhook to your callback URL
4. Check application logs

### Method 2: Manual Testing with cURL

```bash
curl -X POST http://localhost:3000/api/recharge/callback \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "KWK_TEST_123",
    "operator_txn_id": "OP_TEST_456",
    "service": "PREPAID_RECHARGE",
    "amount": 499,
    "status": "SUCCESS",
    "created_at": "2025-12-02T10:00:00Z",
    "completed_at": "2025-12-02T10:00:30Z",
    "operator": "VODAFONE IDEA",
    "mobile_number": "9999999999"
  }'
```

### Method 3: Use Postman

1. Create a new POST request
2. URL: `http://localhost:3000/api/recharge/callback`
3. Headers: `Content-Type: application/json`
4. Body: Use the JSON payload above
5. Send request
6. Check response and database

---

## 📝 Monitoring Webhooks

### Check Webhook Logs

View webhook activity in your database:

```sql
-- Check recent callbacks
SELECT 
  id,
  transaction_ref,
  status,
  callback_received,
  callback_data,
  created_at,
  completed_at
FROM recharge_transactions
WHERE callback_received = true
ORDER BY created_at DESC
LIMIT 20;
```

### Monitor Failed Webhooks

```sql
-- Find transactions without callbacks
SELECT 
  id,
  transaction_ref,
  status,
  created_at
FROM recharge_transactions
WHERE callback_received = false
  AND created_at < NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

---

## 🚨 Troubleshooting

### Webhook Not Received

**Problem:** Transaction completed but no webhook received

**Solutions:**
1. ✅ Verify callback URL is correct in KWIKAPI dashboard
2. ✅ Check if your server is accessible from internet
3. ✅ Verify firewall allows incoming POST requests
4. ✅ Check application logs for errors
5. ✅ Test with manual cURL request
6. ✅ Contact KWIKAPI support

### Webhook Received but Not Processing

**Problem:** Webhook received but transaction not updated

**Solutions:**
1. ✅ Check application logs for errors
2. ✅ Verify transaction exists in database
3. ✅ Check `transaction_id` matches
4. ✅ Verify database connection
5. ✅ Check user wallet exists

### Commission Not Credited

**Problem:** Transaction successful but commission not added

**Solutions:**
1. ✅ Check if status is exactly "SUCCESS"
2. ✅ Verify commission_amount is set in transaction
3. ✅ Check wallet balance before/after
4. ✅ Look for commission transaction record
5. ✅ Check application logs

---

## 🔔 Webhook Retry Logic

### KWIKAPI Retry Behavior

KWIKAPI typically retries failed webhooks:
- **Retry 1:** After 1 minute
- **Retry 2:** After 5 minutes
- **Retry 3:** After 15 minutes
- **Retry 4:** After 1 hour
- **Retry 5:** After 6 hours

**Total Attempts:** Up to 5 retries over 24 hours

### Your Response Requirements

Always return proper HTTP status codes:

```typescript
// Success
return NextResponse.json({ success: true }, { status: 200 });

// Error (will trigger retry)
return NextResponse.json({ success: false }, { status: 500 });
```

---

## 📋 Webhook Configuration Checklist

Before going live, ensure:

- [ ] Callback URL configured in KWIKAPI dashboard
- [ ] Production domain used (not localhost)
- [ ] HTTPS enabled (SSL certificate installed)
- [ ] Firewall allows incoming webhooks
- [ ] Webhook secret configured (if using signature verification)
- [ ] Test webhook sent and received successfully
- [ ] Transaction status updates correctly
- [ ] Commission credits properly
- [ ] Refunds process correctly
- [ ] Logs are being recorded
- [ ] Monitoring is in place

---

## 🌐 Production Deployment

### Step 1: Update Environment Variables

```env
# Production settings
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
KWIKAPI_API_KEY="production_api_key"
KWIKAPI_WEBHOOK_SECRET="production_webhook_secret"
```

### Step 2: Update KWIKAPI Dashboard

1. Login to KWIKAPI dashboard
2. Update callback URL to production:
   ```
   https://yourdomain.com/api/recharge/callback
   ```
3. Save changes

### Step 3: Test Production Webhook

1. Process a small test transaction (₹10)
2. Verify webhook received
3. Check transaction status updated
4. Verify commission credited
5. Monitor logs for any errors

### Step 4: Enable Monitoring

Set up monitoring for:
- Webhook delivery rate
- Failed webhooks
- Processing time
- Error rates

---

## 📞 KWIKAPI Support

If you encounter issues:

**Email:** support@kwikapi.com  
**Website:** https://kwikapi.com  
**Documentation:** https://kwikapi.com/developers  
**Support Hours:** 24/7

**Common Support Requests:**
- Webhook not being sent
- IP addresses for whitelisting
- Webhook secret key
- Retry policy details
- Custom webhook configurations

---

## 🎯 Best Practices

### 1. Always Respond Quickly
- Process webhook in < 5 seconds
- Return 200 status immediately
- Do heavy processing asynchronously

### 2. Handle Duplicates
- Check if callback already processed
- Use `callback_received` flag
- Prevent double commission credits

### 3. Log Everything
- Log all incoming webhooks
- Store raw payload
- Track processing time
- Record any errors

### 4. Monitor Regularly
- Check webhook delivery rate
- Monitor failed transactions
- Track commission payouts
- Review error logs

### 5. Test Thoroughly
- Test all status types (SUCCESS, FAILED)
- Test with different service types
- Test commission calculations
- Test refund processing

---

## 📊 Webhook Statistics

Track these metrics:

| Metric | Target | How to Check |
|--------|--------|--------------|
| Delivery Rate | >99% | Count callbacks vs transactions |
| Processing Time | <2s | Log timestamp differences |
| Success Rate | >95% | Count SUCCESS vs total |
| Error Rate | <1% | Count errors in logs |

---

## 🔄 Webhook Flow Diagram

```
KWIKAPI Transaction Complete
         ↓
    Send Webhook
         ↓
Your Callback URL (/api/recharge/callback)
         ↓
    Verify Payload
         ↓
    Find Transaction
         ↓
    Update Status
         ↓
   ┌─────┴─────┐
   ↓           ↓
SUCCESS      FAILED
   ↓           ↓
Credit      Refund
Commission   Amount
   ↓           ↓
Update      Update
Wallet      Wallet
   ↓           ↓
Return 200 Status
```

---

## ✅ Quick Setup Summary

1. **Configure in KWIKAPI Dashboard:**
   - Add callback URL: `https://yourdomain.com/api/recharge/callback`
   - Enable webhooks for all services
   - Save configuration

2. **Update Your .env:**
   ```env
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   KWIKAPI_WEBHOOK_SECRET="your_secret"
   ```

3. **Test:**
   - Process test transaction
   - Verify webhook received
   - Check status updated
   - Confirm commission credited

4. **Monitor:**
   - Check logs regularly
   - Monitor delivery rate
   - Track failed webhooks
   - Review error logs

---

**🎉 Your webhook is now configured and ready to receive real-time transaction updates from KWIKAPI!**

For any issues or questions, refer to KWIKAPI documentation or contact their support team.
