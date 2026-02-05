# KwikAPI Callback URL Configuration Guide

## 🚨 URGENT: Callback URL Update Required

### Current Issue
The KwikAPI dashboard is configured with an **incorrect callback URL**, which is why callbacks are not being received and transactions remain PENDING.

### Current Configuration (INCORRECT)
```
https://www.vighnahartaonlineservice.in/api/recharge/callback
```

### Required Configuration (CORRECT)
```
https://www.vighnahartaonlineservices.in/api/kwikapi-callback
```

## Key Differences
1. **Domain Fix:** `vighnahartaonlineservice.in` → `vighnahartaonlineservices.in` (add 's')
2. **Endpoint Fix:** `/api/recharge/callback` → `/api/kwikapi-callback`

## Complete Callback Configuration

### Primary Callback URL (MAIN)
```
https://www.vighnahartaonlineservices.in/api/kwikapi-callback
```

### Backup Callback URL (FALLBACK)
```
https://www.vighnahartaonlineservices.in/api/callback
```

## Configuration Steps

### 1. Login to KwikAPI Dashboard
- Go to your KwikAPI merchant dashboard
- Navigate to Settings → Callback URL Settings

### 2. Update Callback URL
Replace the current URL:
```
❌ https://www.vighnahartaonlineservice.in/api/recharge/callback
```

With the correct URL:
```
✅ https://www.vighnahartaonlineservices.in/api/kwikapi-callback
```

### 3. Test Configuration
After updating, test the callback URL:

```bash
# Test the callback endpoint
curl -X POST https://www.vighnahartaonlineservices.in/api/kwikapi-callback \
  -H "Content-Type: application/json" \
  -d '{
    "payid": "TEST123456",
    "status": "SUCCESS",
    "operator_ref": "OP123456",
    "client_id": "test"
  }'
```

**Expected Response:** `SUCCESS`

## Callback URL Details

### Endpoint: `/api/kwikapi-callback`
- **Method:** POST, GET (both supported)
- **Content-Type:** `application/json` or `application/x-www-form-urlencoded`
- **Response:** Plain text "SUCCESS" or "ERROR"

### Parameters Handled
| Parameter | Description | Example |
|-----------|-------------|---------|
| `payid` | KwikAPI Order ID | `1234567890` |
| `status` | Transaction Status | `SUCCESS`, `FAILED`, `PENDING` |
| `operator_ref` | Operator Reference | `OP123456789` |
| `client_id` | Client Identifier | `your_client_id` |

### Backup Endpoint: `/api/callback`
- **Method:** POST
- **Content-Type:** `application/json`
- **Legacy Support:** For older callback format

### Parameters Handled (Backup)
| Parameter | Description | Example |
|-----------|-------------|---------|
| `order_id` | Transaction Reference | `TXN_123456` |
| `status` | Transaction Status | `SUCCESS`, `FAILED` |
| `txid` | Operator Transaction ID | `OP123456` |

## Service Coverage

### These callback URLs handle ALL services:
- ✅ **Mobile Prepaid Recharge**
- ✅ **Mobile Postpaid Bill Payment**
- ✅ **DTH Recharge**
- ✅ **Electricity Bill Payment**
- ✅ **Gas Bill Payment**
- ✅ **Water Bill Payment**
- ✅ **Broadband Bill Payment**
- ✅ **Landline Bill Payment**
- ✅ **Insurance Premium Payment**
- ✅ **Money Transfer**
- ✅ **All other KwikAPI services**

## Verification Steps

### 1. Check Current Configuration
In KwikAPI dashboard, verify the callback URL is set to:
```
https://www.vighnahartaonlineservices.in/api/kwikapi-callback
```

### 2. Test Callback Response
```bash
# Test GET request
curl https://www.vighnahartaonlineservices.in/api/kwikapi-callback

# Test POST request
curl -X POST https://www.vighnahartaonlineservices.in/api/kwikapi-callback \
  -H "Content-Type: application/json" \
  -d '{"payid":"TEST","status":"SUCCESS"}'
```

Both should return `OK` or `SUCCESS`.

### 3. Monitor Transaction Processing
After configuration:
1. Process a small test transaction (₹10 mobile recharge)
2. Check if callback is received within 30 seconds
3. Verify transaction status updates from PENDING to SUCCESS/FAILED
4. Confirm wallet balance is updated correctly

## Troubleshooting

### If Callbacks Still Not Working

#### Check 1: URL Accessibility
```bash
curl -I https://www.vighnahartaonlineservices.in/api/kwikapi-callback
```
Should return `200 OK` or `405 Method Not Allowed` (both are fine).

#### Check 2: SSL Certificate
```bash
curl -v https://www.vighnahartaonlineservices.in/api/kwikapi-callback
```
Should show valid SSL certificate.

#### Check 3: Firewall/Security
- Ensure the domain is accessible from KwikAPI servers
- Check if any firewall is blocking KwikAPI IPs
- Verify no rate limiting on callback endpoints

### Common Issues

#### Issue 1: Domain Typo
❌ `vighnahartaonlineservice.in` (missing 's')  
✅ `vighnahartaonlineservices.in` (correct)

#### Issue 2: Wrong Endpoint
❌ `/api/recharge/callback` (old endpoint)  
✅ `/api/kwikapi-callback` (correct endpoint)

#### Issue 3: HTTP vs HTTPS
❌ `http://` (insecure)  
✅ `https://` (secure - required)

## Expected Behavior After Fix

### For New Transactions
1. User initiates recharge/bill payment
2. Transaction created with status PENDING
3. KwikAPI processes the transaction
4. KwikAPI sends callback to our URL within 30 seconds
5. Our system receives callback and updates status
6. Money is deducted from wallet (if SUCCESS)
7. Commission/cashback is added (if applicable)
8. User sees updated status immediately

### For Existing PENDING Transactions
- Use the recovery script for transactions that missed callbacks
- Monitor for any other PENDING transactions from the past few days
- Consider running a bulk recovery for recent PENDING transactions

## Contact Information

### KwikAPI Support
- **Dashboard:** Update callback URL in settings
- **Support:** Contact for any configuration issues
- **Documentation:** Refer to KwikAPI callback documentation

### Testing Checklist
- [ ] Callback URL updated in KwikAPI dashboard
- [ ] URL accessibility tested
- [ ] SSL certificate verified
- [ ] Test transaction processed successfully
- [ ] Callback received and processed
- [ ] Wallet balance updated correctly
- [ ] Transaction status updated to SUCCESS

## Immediate Action Required

1. **Update KwikAPI Dashboard** with correct callback URL
2. **Test with small transaction** (₹10 recharge)
3. **Monitor callback logs** for successful processing
4. **Verify wallet deduction** happens in real-time
5. **Check for any other PENDING transactions** that need recovery

Once this configuration is updated, all future transactions should process correctly with real-time status updates and proper wallet deductions.