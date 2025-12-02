# KWIKAPI Callback/Webhook Setup Guide

## Overview
This guide explains how to configure KWIKAPI webhooks/callbacks to receive real-time transaction status updates for recharge and bill payment transactions.

## 🔗 Callback URL

### Production URL
```
https://your-domain.com/api/callback
```

### Local Development (using ngrok)
```
https://your-ngrok-url.ngrok.io/api/callback
```

### Staging URL
```
https://staging.your-domain.com/api/callback
```

## 📋 KWIKAPI Callback Configuration

### Step 1: Configure Callback URL in KWIKAPI Dashboard

1. Login to your KWIKAPI dashboard
2. Navigate to **Settings** → **Webhook Configuration**
3. Enter your callback URL: `https://your-domain.com/api/callback`
4. Select callback events:
   - ✅ Transaction Success
   - ✅ Transaction Failed
   - ✅ Transaction Pending
5. Save configuration

### Step 2: Verify Callback Endpoint

Test your callback endpoint is accessible:

```bash
curl https://your-domain.com/api/callback
```

Expected response:
```json
{
  "success": true,
  "message": "KWIKAPI Callback Endpoint",
  "endpoint": "/api/callback",
  "methods": ["POST"],
  "description": "Unified callback handler for all KWIKAPI recharge services"
}
```

## 📨 KWIKAPI v2 Callback Format

### Callback Request

KWIKAPI will send a POST request to your callback URL with the following JSON payload:

```json
{
  "order_id": "TXN_1733123456789",
  "status": "SUCCESS",
  "txid": "KWK123456789",
  "operator_txn_id": "OP987654321",
  "amount": "100.00",
  "number": "9999999999",
  "opid": "1",
  "message": "Transaction successful",
  "service_type": "PREPAID",
  "timestamp": "2024-12-02T10:30:00Z"
}
```

### Callback Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `order_id` | string | Your unique transaction reference (transaction_ref) |
| `status` | string | Transaction status: SUCCESS, FAILED, PENDING |
| `txid` | string | KWIKAPI transaction ID |
| `operator_txn_id` | string | Operator's transaction reference |
| `amount` | string | Transaction amount |
| `number` | string | Mobile/DTH/Consumer number |
| `opid` | integer | KWIKAPI operator ID |
| `message` | string | Status message |
| `service_type` | string | Service type (PREPAID, POSTPAID, DTH, ELECTRICITY) |

### Status Values

| Status | Description | Action |
|--------|-------------|--------|
| `SUCCESS` | Transaction completed successfully | Credit commission/cashback to user |
| `FAILED` | Transaction failed | Refund amount to user wallet |
| `PENDING` | Transaction is being processed | No action, wait for final status |
| `REFUNDED` | Transaction was refunded | Credit refund to user wallet |

## 🔄 Callback Processing Flow

```
KWIKAPI sends callback
    ↓
POST /api/callback
    ↓
Extract order_id (transaction_ref)
    ↓
Find transaction in database
    ↓
Check previous status
    ↓
Update transaction status
    ↓
If SUCCESS (and was PENDING):
    - Credit commission/cashback to wallet
    - Create commission transaction record
    ↓
If FAILED (and was PENDING):
    - Refund total_amount to wallet
    - Create refund transaction record
    ↓
Return success response to KWIKAPI
```

## 💾 Database Updates

### Transaction Status Update
```sql
UPDATE recharge_transactions
SET 
  status = 'SUCCESS',
  operator_transaction_id = 'OP987654321',
  callback_received = true,
  callback_data = '{"order_id": "TXN_123", ...}',
  completed_at = NOW(),
  updated_at = NOW()
WHERE transaction_ref = 'TXN_1733123456789';
```

### Commission/Cashback Credit (on SUCCESS)
```sql
-- Update wallet balance
UPDATE wallets
SET balance = balance + commission_amount
WHERE user_id = 'user_uuid';

-- Create transaction record
INSERT INTO transactions (
  user_id, wallet_id, type, amount, status, 
  description, reference
) VALUES (
  'user_uuid', 'wallet_uuid', 'COMMISSION', 50.00, 'COMPLETED',
  'Commission for PREPAID 9999999999', 'TXN_1733123456789'
);
```

### Refund (on FAILED)
```sql
-- Update wallet balance
UPDATE wallets
SET balance = balance + total_amount
WHERE user_id = 'user_uuid';

-- Create refund transaction
INSERT INTO transactions (
  user_id, wallet_id, type, amount, status,
  description, reference
) VALUES (
  'user_uuid', 'wallet_uuid', 'REFUND', 102.00, 'COMPLETED',
  'Refund for failed PREPAID 9999999999', 'TXN_1733123456789'
);
```

## 🧪 Testing Callbacks

### Method 1: Using Postman

1. Create a new POST request
2. URL: `http://localhost:3000/api/callback`
3. Headers:
   ```
   Content-Type: application/json
   ```
4. Body (raw JSON):
   ```json
   {
     "order_id": "TXN_1733123456789",
     "status": "SUCCESS",
     "txid": "KWK123456789",
     "operator_txn_id": "OP987654321",
     "amount": "100.00",
     "number": "9999999999",
     "opid": "1",
     "message": "Transaction successful"
   }
   ```
5. Send request

### Method 2: Using cURL

```bash
curl -X POST http://localhost:3000/api/callback \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TXN_1733123456789",
    "status": "SUCCESS",
    "txid": "KWK123456789",
    "operator_txn_id": "OP987654321",
    "amount": "100.00",
    "number": "9999999999",
    "opid": "1",
    "message": "Transaction successful"
  }'
```

### Method 3: Test Different Statuses

**Test SUCCESS callback:**
```bash
curl -X POST http://localhost:3000/api/callback \
  -H "Content-Type: application/json" \
  -d '{"order_id": "TXN_123", "status": "SUCCESS", "txid": "KWK123"}'
```

**Test FAILED callback:**
```bash
curl -X POST http://localhost:3000/api/callback \
  -H "Content-Type: application/json" \
  -d '{"order_id": "TXN_123", "status": "FAILED", "message": "Insufficient balance"}'
```

**Test PENDING callback:**
```bash
curl -X POST http://localhost:3000/api/callback \
  -H "Content-Type: application/json" \
  -d '{"order_id": "TXN_123", "status": "PENDING"}'
```

## 🔍 Monitoring Callbacks

### Check Callback Logs

View application logs to see callback processing:

```bash
# Development
npm run dev

# Production (PM2)
pm2 logs your-app-name

# Docker
docker logs your-container-name
```

### Database Query to Check Callbacks

```sql
-- Check transactions with callbacks received
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
LIMIT 10;

-- Check pending transactions (no callback yet)
SELECT 
  id,
  transaction_ref,
  status,
  callback_received,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_pending
FROM recharge_transactions
WHERE status = 'PENDING' AND callback_received = false
ORDER BY created_at DESC;
```

## 🚨 Error Handling

### Common Issues and Solutions

#### 1. Transaction Not Found
**Error:** `Transaction not found`

**Cause:** order_id doesn't match any transaction_ref in database

**Solution:**
- Verify transaction_ref is correctly stored when creating transaction
- Check if order_id in callback matches transaction_ref exactly
- Review transaction creation logs

#### 2. Duplicate Callbacks
**Issue:** Same callback received multiple times

**Solution:**
- Check `callback_received` flag before processing
- Use database transactions for atomic updates
- Implement idempotency key

**Code Example:**
```typescript
// Check if callback already processed
if (transaction.callback_received && transaction.status === newStatus) {
  return NextResponse.json({
    success: true,
    message: 'Callback already processed',
  });
}
```

#### 3. Wallet Not Found
**Error:** `Wallet not found`

**Cause:** User doesn't have a wallet record

**Solution:**
- Ensure wallet is created during user registration
- Add wallet creation in callback handler as fallback

#### 4. Callback Timeout
**Issue:** KWIKAPI times out waiting for response

**Solution:**
- Optimize database queries
- Use async processing for heavy operations
- Return response quickly (< 5 seconds)

## 🔐 Security Considerations

### 1. Verify Callback Source

Add IP whitelist for KWIKAPI servers:

```typescript
const KWIKAPI_IPS = [
  '123.45.67.89',  // KWIKAPI server IP
  '123.45.67.90',  // KWIKAPI backup IP
];

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip');
  
  if (!KWIKAPI_IPS.includes(clientIP)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 403 }
    );
  }
  
  // Process callback...
}
```

### 2. Validate Callback Signature (if provided)

```typescript
import crypto from 'crypto';

function verifySignature(body: any, signature: string): boolean {
  const secret = process.env.KWIKAPI_WEBHOOK_SECRET!;
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return hash === signature;
}
```

### 3. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});
```

## 📊 Callback Response Format

### Success Response
```json
{
  "success": true,
  "message": "Callback processed successfully",
  "transaction_id": "uuid",
  "status": "SUCCESS"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Transaction not found",
  "error_code": "TRANSACTION_NOT_FOUND"
}
```

## 🔄 Retry Mechanism

KWIKAPI will retry callbacks if:
- Response status is not 200
- Response takes > 30 seconds
- Connection fails

**Retry Schedule:**
- Immediate
- After 1 minute
- After 5 minutes
- After 15 minutes
- After 1 hour

**Best Practice:** Always return 200 status even if there's an error, and log the error internally.

## 📝 Callback Logging

### Log Format
```typescript
console.log('KWIKAPI Callback:', {
  timestamp: new Date().toISOString(),
  order_id: body.order_id,
  status: body.status,
  amount: body.amount,
  processed: true,
  duration_ms: Date.now() - startTime,
});
```

### Store Callback History
```sql
CREATE TABLE callback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_ref VARCHAR(100),
  callback_data JSONB,
  status VARCHAR(20),
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎯 Production Checklist

- [ ] Callback URL configured in KWIKAPI dashboard
- [ ] SSL certificate installed (HTTPS required)
- [ ] Callback endpoint tested with all status types
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Database indexes on transaction_ref
- [ ] Monitoring alerts set up
- [ ] IP whitelist configured (optional)
- [ ] Signature verification implemented (if available)
- [ ] Rate limiting enabled
- [ ] Backup callback URL configured (optional)

## 📞 Support

### KWIKAPI Support
- Email: support@kwikapi.com
- Phone: +91-XXXXXXXXXX
- Dashboard: https://www.kwikapi.com/dashboard

### Debugging Steps
1. Check callback URL is accessible from internet
2. Verify SSL certificate is valid
3. Check application logs for errors
4. Query database for transaction status
5. Test callback manually with Postman
6. Contact KWIKAPI support if issue persists

## 📚 Related Documentation

- [KWIKAPI Complete Integration Guide](./KWIKAPI_COMPLETE_INTEGRATION_GUIDE.md)
- [KWIKAPI Implementation Guide](./KWIKAPI_IMPLEMENTATION_GUIDE.md)
- [Database Schema](./database/migrations/create_recharge_system.sql)
- [API Documentation](./docs/API_DOCUMENTATION.md)

---

**Last Updated**: December 2, 2024
**Version**: 2.0
**Status**: ✅ Production Ready
