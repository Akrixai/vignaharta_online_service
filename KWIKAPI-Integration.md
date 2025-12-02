# KWIKAPI v3.0.0 - Integration Guide
## Prepaid, Postpaid, DTH, Electricity Bill & Plan Fetch APIs

---

## 1. BASE CONFIGURATION

### API Base URL
```
https://api.kwikapi.com/v3/
```

### Authentication Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
X-Request-ID: unique-request-id
```

### Response Format
- **Default:** JSON
- **Status Codes:** 200 (Success), 400 (Bad Request), 401 (Unauthorized), 500 (Server Error)

---

## 2. PREPAID RECHARGE API

### Endpoint
```
POST https://api.kwikapi.com/v3/recharge/prepaid
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY",
  "X-Request-ID": "unique-timestamp-id"
}
```

### Request Body
```json
{
  "operator_code": "VI",
  "mobile_number": "9999999999",
  "amount": 499,
  "circle_code": "AP",
  "plan_id": "plan_12345",
  "transaction_ref": "TXN_1234567890",
  "customer_name": "John Doe",
  "email": "john@example.com",
  "callback_url": "https://yourportal.com/callback"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| operator_code | string | Yes | Operator code (VI, AIRTEL, IDEA, JIOAIRTEL) |
| mobile_number | string | Yes | Customer mobile number (10 digits) |
| amount | integer | Yes | Recharge amount in ₹ (minimum: ₹10) |
| circle_code | string | Yes | Circle code (AP, TN, MP, etc.) |
| plan_id | string | No | Specific plan ID if available |
| transaction_ref | string | Yes | Unique transaction reference from your system |
| customer_name | string | No | Customer name |
| email | string | No | Customer email for confirmation |
| callback_url | string | No | Callback URL for transaction status |

### Sample Success Response
```json
{
  "status": 200,
  "success": true,
  "message": "Prepaid recharge request accepted",
  "data": {
    "transaction_id": "KWK_1234567890",
    "operator_txn_id": "OP_9876543210",
    "mobile_number": "9999999999",
    "amount": 499,
    "operator": "VODAFONE IDEA",
    "circle": "AP",
    "status": "SUCCESS",
    "timestamp": "2025-12-01T19:31:00Z",
    "validity": "365 days"
  }
}
```

### Sample Error Response
```json
{
  "status": 400,
  "success": false,
  "message": "Invalid mobile number format",
  "error_code": "INVALID_MOBILE",
  "data": null
}
```

### cURL Example
```bash
curl -X POST https://api.kwikapi.com/v3/recharge/prepaid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "operator_code": "VI",
    "mobile_number": "9999999999",
    "amount": 499,
    "circle_code": "AP",
    "transaction_ref": "TXN_1234567890"
  }'
```

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

async function rechargePreaid() {
  try {
    const response = await axios.post(
      'https://api.kwikapi.com/v3/recharge/prepaid',
      {
        operator_code: 'VI',
        mobile_number: '9999999999',
        amount: 499,
        circle_code: 'AP',
        transaction_ref: 'TXN_' + Date.now()
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        }
      }
    );
    console.log('Recharge Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

---

## 3. POSTPAID RECHARGE API

### Endpoint
```
POST https://api.kwikapi.com/v3/recharge/postpaid
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY",
  "X-Request-ID": "unique-timestamp-id"
}
```

### Request Body
```json
{
  "operator_code": "AIRTEL",
  "mobile_number": "9999999999",
  "amount": 500,
  "circle_code": "MH",
  "customer_account_id": "ACC_12345",
  "transaction_ref": "TXN_1234567890",
  "customer_name": "Jane Doe",
  "email": "jane@example.com",
  "payment_mode": "WALLET"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| operator_code | string | Yes | Operator code (AIRTEL, VI, JIOAIRTEL) |
| mobile_number | string | Yes | Postpaid connection number (10 digits) |
| amount | integer | Yes | Bill payment amount in ₹ |
| circle_code | string | Yes | Circle code |
| customer_account_id | string | No | Customer account ID from operator |
| transaction_ref | string | Yes | Unique transaction reference |
| customer_name | string | No | Customer name |
| email | string | No | Customer email |
| payment_mode | string | No | Payment mode (WALLET, CARD, BANK) |

### Sample Success Response
```json
{
  "status": 200,
  "success": true,
  "message": "Postpaid bill payment accepted",
  "data": {
    "transaction_id": "KWK_1234567890",
    "operator_txn_id": "OP_9876543210",
    "mobile_number": "9999999999",
    "amount": 500,
    "operator": "AIRTEL",
    "circle": "MH",
    "status": "SUCCESS",
    "bill_period": "November 2025",
    "timestamp": "2025-12-01T19:31:00Z"
  }
}
```

### Sample Error Response
```json
{
  "status": 400,
  "success": false,
  "message": "Insufficient balance in wallet",
  "error_code": "INSUFFICIENT_BALANCE",
  "data": null
}
```

---

## 4. DTH RECHARGE API

### Endpoint
```
POST https://api.kwikapi.com/v3/recharge/dth
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY",
  "X-Request-ID": "unique-timestamp-id"
}
```

### Request Body
```json
{
  "operator_code": "TATASKY",
  "dth_number": "9876543210",
  "amount": 299,
  "plan_id": "TATASKY_PLAN_12345",
  "transaction_ref": "TXN_1234567890",
  "customer_name": "Ram Kumar",
  "email": "ram@example.com"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| operator_code | string | Yes | DTH Operator (TATASKY, DISHD2H, SUNTV, VIDEOCON) |
| dth_number | string | Yes | DTH subscription number (10-12 digits) |
| amount | integer | Yes | Recharge amount in ₹ |
| plan_id | string | Yes | DTH Plan ID |
| transaction_ref | string | Yes | Unique transaction reference |
| customer_name | string | No | Customer name |
| email | string | No | Customer email |

### DTH Operators Supported
- **TATASKY** - TataSky
- **DISHD2H** - Dish TV
- **SUNTV** - Sun Direct
- **VIDEOCON** - Videocon D2H
- **BIGTV** - Big TV

### Sample Success Response
```json
{
  "status": 200,
  "success": true,
  "message": "DTH recharge request accepted",
  "data": {
    "transaction_id": "KWK_1234567890",
    "operator_txn_id": "OP_9876543210",
    "dth_number": "9876543210",
    "amount": 299,
    "operator": "TATASKY",
    "status": "SUCCESS",
    "plan_validity": "28 days",
    "plan_name": "Premium HD Pack",
    "timestamp": "2025-12-01T19:31:00Z"
  }
}
```

### cURL Example
```bash
curl -X POST https://api.kwikapi.com/v3/recharge/dth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "operator_code": "TATASKY",
    "dth_number": "9876543210",
    "amount": 299,
    "plan_id": "TATASKY_PLAN_12345",
    "transaction_ref": "TXN_1234567890"
  }'
```

---

## 5. ELECTRICITY BILL PAYMENT API

### Endpoint
```
POST https://api.kwikapi.com/v3/bill/electricity
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY",
  "X-Request-ID": "unique-timestamp-id"
}
```

### Request Body
```json
{
  "operator_code": "MSEDCL",
  "consumer_number": "123456789012",
  "amount": 1500,
  "circle_code": "MH",
  "bill_month": "11",
  "bill_year": "2025",
  "transaction_ref": "TXN_1234567890",
  "customer_name": "Priya Singh",
  "email": "priya@example.com"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| operator_code | string | Yes | Electricity board code (MSEDCL, BESCOM, TNEB, etc.) |
| consumer_number | string | Yes | Consumer/meter ID |
| amount | integer | Yes | Bill amount in ₹ |
| circle_code | string | Yes | Circle/region code |
| bill_month | string | No | Bill month (01-12) |
| bill_year | string | No | Bill year (YYYY) |
| transaction_ref | string | Yes | Unique transaction reference |
| customer_name | string | No | Customer name |
| email | string | No | Customer email |

### Electricity Operators Supported
- **MSEDCL** - Maharashtra State
- **BESCOM** - Bangalore Electric
- **TNEB** - Tamil Nadu
- **WESCO** - Western Electricity
- **NESCO** - Northern Electricity
- **KPTCL** - Karnataka
- **APCPDCL** - Andhra Pradesh

### Sample Success Response
```json
{
  "status": 200,
  "success": true,
  "message": "Electricity bill payment accepted",
  "data": {
    "transaction_id": "KWK_1234567890",
    "operator_txn_id": "EB_9876543210",
    "consumer_number": "123456789012",
    "amount": 1500,
    "operator": "MSEDCL",
    "bill_month": "November",
    "bill_year": "2025",
    "status": "SUCCESS",
    "due_date": "2025-12-15",
    "timestamp": "2025-12-01T19:31:00Z"
  }
}
```

### Bill Fetch API (Before Payment)
```
GET https://api.kwikapi.com/v3/bill/electricity/fetch?operator_code=MSEDCL&consumer_number=123456789012&circle_code=MH
```

### Bill Fetch Response
```json
{
  "status": 200,
  "success": true,
  "message": "Bill fetched successfully",
  "data": {
    "consumer_number": "123456789012",
    "consumer_name": "Priya Singh",
    "amount": 1500,
    "due_amount": 1500,
    "bill_month": "November",
    "bill_year": "2025",
    "due_date": "2025-12-15",
    "late_fee": 0,
    "last_payment_date": "2025-10-15",
    "operator": "MSEDCL"
  }
}
```

---

## 6. PLAN FETCH API - PREPAID

### Endpoint
```
GET https://api.kwikapi.com/v3/plans/prepaid?operator_code=VI&circle_code=AP
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| operator_code | string | Yes | Operator code (VI, AIRTEL, IDEA, JIOAIRTEL) |
| circle_code | string | Yes | Circle code (AP, TN, MH, etc.) |
| min_amount | integer | No | Minimum plan amount filter |
| max_amount | integer | No | Maximum plan amount filter |
| validity | string | No | Validity filter (daily, monthly, yearly) |

### Sample Success Response
```json
{
  "status": 200,
  "success": true,
  "message": "Plans fetched successfully",
  "data": {
    "operator": "VODAFONE IDEA",
    "circle": "AP",
    "total_plans": 45,
    "plans": [
      {
        "plan_id": "VI_AP_99_1",
        "amount": 99,
        "validity": "7 days",
        "type": "TOP_UP",
        "description": "99 Top Up",
        "data": "0 GB",
        "voice": "Unlimited",
        "sms": "Unlimited",
        "features": []
      },
      {
        "plan_id": "VI_AP_299_1",
        "amount": 299,
        "validity": "28 days",
        "type": "FULL_TALKTIME",
        "description": "Complete 4G Data Plan",
        "data": "1.5 GB/day",
        "voice": "Unlimited",
        "sms": "Unlimited",
        "features": ["4G DATA", "PRIME", "VAS"]
      },
      {
        "plan_id": "VI_AP_499_1",
        "amount": 499,
        "validity": "28 days",
        "type": "DATA_PLAN",
        "description": "Premium Data Plan",
        "data": "2 GB/day",
        "voice": "Unlimited",
        "sms": "100 SMS/day",
        "features": ["4G DATA", "ROAMING", "PRIME"]
      },
      {
        "plan_id": "VI_AP_1499_1",
        "amount": 1499,
        "validity": "84 days",
        "type": "COMBO_PLAN",
        "description": "Quarterly Combo",
        "data": "3 GB/day",
        "voice": "Unlimited",
        "sms": "Unlimited",
        "features": ["4G DATA", "STREAMING", "ROAMING"]
      }
    ]
  }
}
```

---

## 7. PLAN FETCH API - DTH

### Endpoint
```
GET https://api.kwikapi.com/v3/plans/dth?operator_code=TATASKY
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| operator_code | string | Yes | DTH operator code |
| min_amount | integer | No | Minimum plan amount |
| max_amount | integer | No | Maximum plan amount |
| category | string | No | Category (ENTERTAINMENT, SPORTS, HD, etc.) |

### Sample Success Response
```json
{
  "status": 200,
  "success": true,
  "message": "DTH plans fetched successfully",
  "data": {
    "operator": "TATASKY",
    "total_plans": 32,
    "plans": [
      {
        "plan_id": "TATASKY_PLAN_99_1",
        "amount": 99,
        "validity": "1 month",
        "category": "ENTERTAINMENT",
        "channels_count": 50,
        "description": "Entertainment Basic Pack",
        "hd_channels": 5
      },
      {
        "plan_id": "TATASKY_PLAN_199_1",
        "amount": 199,
        "validity": "1 month",
        "category": "ENTERTAINMENT",
        "channels_count": 100,
        "description": "Entertainment Premium Pack",
        "hd_channels": 15
      },
      {
        "plan_id": "TATASKY_PLAN_299_1",
        "amount": 299,
        "validity": "1 month",
        "category": "COMBO",
        "channels_count": 150,
        "description": "Full Pack with Sports",
        "hd_channels": 25
      },
      {
        "plan_id": "TATASKY_PLAN_399_1",
        "amount": 399,
        "validity": "1 month",
        "category": "SPORTS",
        "channels_count": 180,
        "description": "Premium with All Sports",
        "hd_channels": 40
      }
    ]
  }
}
```

---

## 8. OPERATOR & CIRCLE CHECK API

### Endpoint
```
GET https://api.kwikapi.com/v3/operator/check?mobile_number=9999999999
```

### Request Headers
```json
{
  "Authorization": "Bearer YOUR_API_KEY"
}
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mobile_number | string | Yes | Mobile number (10 digits) |

### Sample Success Response
```json
{
  "status": 200,
  "success": true,
  "message": "Operator detected successfully",
  "data": {
    "mobile_number": "9999999999",
    "operator_code": "VI",
    "operator_name": "VODAFONE IDEA",
    "circle_code": "AP",
    "circle_name": "Andhra Pradesh",
    "operator_type": "PREPAID",
    "sms_sent": true
  }
}
```

---

## 9. TRANSACTION STATUS API

### Endpoint
```
GET https://api.kwikapi.com/v3/transaction/status?transaction_id=KWK_1234567890
```

### Request Headers
```json
{
  "Authorization": "Bearer YOUR_API_KEY"
}
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| transaction_id | string | Yes | KwikAPI transaction ID |

### Sample Success Response
```json
{
  "status": 200,
  "success": true,
  "message": "Transaction found",
  "data": {
    "transaction_id": "KWK_1234567890",
    "operator_txn_id": "OP_9876543210",
    "service": "PREPAID_RECHARGE",
    "amount": 499,
    "status": "SUCCESS",
    "created_at": "2025-12-01T19:31:00Z",
    "completed_at": "2025-12-01T19:31:45Z",
    "operator": "VODAFONE IDEA",
    "mobile_number": "9999999999"
  }
}
```

---

## 10. ERROR CODES REFERENCE

| Error Code | HTTP Status | Description | Resolution |
|-----------|-------------|-------------|-----------|
| INVALID_MOBILE | 400 | Invalid mobile number format | Check mobile number (must be 10 digits) |
| INVALID_OPERATOR | 400 | Invalid operator code | Verify operator code from supported list |
| INVALID_AMOUNT | 400 | Amount is out of range | Check min/max amount for operator |
| INSUFFICIENT_BALANCE | 402 | Insufficient wallet balance | Add funds to wallet |
| UNAUTHORIZED | 401 | Invalid or missing API key | Check authorization header |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests | Wait before retrying |
| OPERATOR_DOWN | 503 | Operator service unavailable | Retry after some time |
| INVALID_CIRCLE | 400 | Invalid circle code | Verify circle code |
| TRANSACTION_EXISTS | 409 | Duplicate transaction | Check transaction history |
| INTERNAL_ERROR | 500 | Server error | Contact support |

---

## 11. INTEGRATION FLOW DIAGRAM

```
User Portal
    ↓
1. Check Operator → Circle Detection API
    ↓
2. Fetch Plans → Plan Fetch API (Prepaid/DTH)
    ↓
3. User Selects Plan
    ↓
4. Submit Recharge → Recharge API (Prepaid/Postpaid/DTH)
    ↓
5. Check Status → Transaction Status API
    ↓
6. Show Success/Failure to User
```

---

## 12. IMPLEMENTATION BEST PRACTICES

### 1. **Always Use Unique Transaction References**
```javascript
const transactionRef = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
```

### 2. **Implement Retry Logic**
```javascript
async function rechargeWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.post(API_URL, params);
      return response.data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. **Always Fetch Transaction Status**
```javascript
// After recharge submission, always fetch status to verify
async function verifyTransaction(transactionId) {
  const response = await axios.get(
    `https://api.kwikapi.com/v3/transaction/status?transaction_id=${transactionId}`,
    { headers: { 'Authorization': `Bearer ${API_KEY}` } }
  );
  return response.data.data;
}
```

### 4. **Handle Callbacks**
```javascript
app.post('/kwikapi-callback', (req, res) => {
  const { transaction_id, status, amount } = req.body;
  
  // Update your database
  updateTransaction(transaction_id, status);
  
  // Send confirmation to user
  notifyUser(transaction_id, status);
  
  res.json({ success: true });
});
```

---

## 13. RATE LIMITS

- **Prepaid Recharge:** 100 requests/minute
- **Postpaid Recharge:** 100 requests/minute
- **DTH Recharge:** 100 requests/minute
- **Bill Payment:** 50 requests/minute
- **Plan Fetch:** 1000 requests/minute (cached)
- **Status Check:** 500 requests/minute

---

## 14. COMMON ERRORS & SOLUTIONS

### Error: `"INVALID_MESSAGE_FORMAT"`
**Cause:** Missing or incorrect parameters
**Solution:** Verify all required parameters are present

### Error: `"OPERATOR_DOWN"`
**Cause:** Operator service temporarily unavailable
**Solution:** Implement retry logic with exponential backoff

### Error: `"INSUFFICIENT_BALANCE"`
**Cause:** Wallet balance is low
**Solution:** Display message to user and ask to add funds

### Error: `"RATE_LIMIT_EXCEEDED"`
**Cause:** Too many requests sent
**Solution:** Implement request queuing and rate limiting

---

## 15. WEBHOOK/CALLBACK STRUCTURE

When you provide a `callback_url` in requests, KwikAPI will POST this data:

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

---

## 16. TESTING ENDPOINTS

Use these test parameters in development:

**Test Mobile Number:** `9876543210`
**Test DTH Number:** `9988776655`
**Test Consumer Number:** `123456789012`

Always set `transaction_ref` to `TEST_` + timestamp in development.

---

**For more details, visit:** https://documenter.getpostman.com/view/1775965/TzkzrzSr
**Support Email:** support@kwikapi.com
**Documentation:** https://kwikapi.com/developers


The KwikAPI “wallet balance” API allows you to fetch your current available wallet balance—this is essential for managing your portal’s liquidity and ensuring you have sufficient funds before initiating transactions like recharges, bill payments, and DTH operations.

Wallet Balance API Details
Endpoint
text
GET https://api.kwikapi.com/v3/wallet/balance
Headers
json
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json",
  "X-Request-ID": "unique-request-id" // generate as per earlier instructions
}
Request Parameters
None required in the query or body. Only the exact headers as above.

Sample Success Response
json
{
  "status": 200,
  "success": true,
  "message": "Balance fetched successfully",
  "data": {
    "wallet_balance": 12054.62,
    "blocked_amount": 1000.00,
    "available_balance": 11054.62,
    "currency": "INR",
    "updated_at": "2025-12-01T18:52:23Z"
  }
}
Sample Error Response
json
{
  "status": 401,
  "success": false,
  "message": "Invalid/Expired token",
  "error_code": "UNAUTHORIZED",
  "data": null
}
Key Fields in the Response
wallet_balance — Total (including any blocked for pending transactions)

blocked_amount — Amount temporarily unavailable (for pendings)

available_balance — Usable for new requests

currency — e.g. "INR"

updated_at — Timestamp of last fetch

Usage
Use this endpoint periodically or before critical transactions.

Useful for automated checks to warn admin when funds are low.

Ensure to always pass a unique X-Request-ID.

Sample cURL
bash
curl -X GET https://api.kwikapi.com/v3/wallet/balance \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: req_1234567890123"
Best Practice
Check the available_balance field before initiating user recharges or payments to avoid failures due to low funds.