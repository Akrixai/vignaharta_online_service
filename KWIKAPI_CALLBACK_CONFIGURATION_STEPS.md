# KwikAPI Callback Configuration - Immediate Action Required

## 🚨 CRITICAL ISSUE IDENTIFIED

### Current Problem
The KwikAPI dashboard is configured with an **incorrect callback URL**:

**❌ Current (Wrong):** `https://www.vighnahartaonlineservice.in/api/recharge/callback`

**✅ Required (Correct):** `https://www.vighnahartaonlineservice.in/api/kwikapi-callback`

### Issues with Current URL
1. **Endpoint Error:** Using old endpoint (`/api/recharge/callback` vs `/api/kwikapi-callback`)
2. **Domain Confirmed:** `vighnahartaonlineservice.in` (without 's') is the correct production domain

## IMMEDIATE STEPS TO FIX

### Step 1: Update KwikAPI Dashboard
1. Login to your KwikAPI merchant dashboard
2. Go to **Settings** → **Callback URL Configuration**
3. **Replace** the current URL:
   ```
   FROM: https://www.vighnahartaonlineservice.in/api/recharge/callback
   TO:   https://www.vighnahartaonlineservice.in/api/kwikapi-callback
   ```
4. **Save** the configuration

### Step 2: Verify URL is Working
Test the new callback URL:
```bash
curl -X GET https://www.vighnahartaonlineservice.in/api/kwikapi-callback
```
**Expected Response:** `OK` (200 status)

```bash
curl -X POST https://www.vighnahartaonlineservice.in/api/kwikapi-callback \
  -H "Content-Type: application/json" \
  -d '{"payid":"TEST123","status":"SUCCESS","operator_ref":"OP123"}'
```
**Expected Response:** `SUCCESS` or error message

### Step 3: Test with Small Transaction
1. Process a small test transaction (₹10 mobile recharge)
2. Monitor if callback is received within 30 seconds
3. Check if transaction status updates from PENDING to SUCCESS
4. Verify wallet balance is deducted correctly

## BACKUP CONFIGURATION

### Primary Callback URL (Main)
```
https://www.vighnahartaonlineservice.in/api/kwikapi-callback
```

### Secondary Callback URL (Backup)
```
https://www.vighnahartaonlineservice.in/api/callback
```

### Legacy Support (Keep for compatibility)
```
https://www.vighnahartaonlineservice.in/api/recharge/callback
```

## WHAT THIS FIXES

### Before Fix (Current State)
- ❌ Callbacks sent to wrong domain/endpoint
- ❌ Transactions remain PENDING forever
- ❌ Money not deducted from wallet
- ❌ Users see SUCCESS on KwikAPI but PENDING on your platform
- ❌ Manual intervention required for every transaction

### After Fix (Expected State)
- ✅ Callbacks received in real-time
- ✅ Transactions update to SUCCESS/FAILED automatically
- ✅ Money deducted from wallet immediately on SUCCESS
- ✅ Commission/cashback added automatically
- ✅ Users see consistent status across platforms

## SERVICES AFFECTED

This callback URL configuration affects **ALL** KwikAPI services:
- Mobile Prepaid Recharge
- Mobile Postpaid Bill Payment
- DTH Recharge
- Electricity Bill Payment
- Gas Bill Payment
- Water Bill Payment
- Broadband Bill Payment
- Landline Bill Payment
- Insurance Premium Payment
- Money Transfer
- All other KwikAPI services

## VERIFICATION CHECKLIST

After updating the callback URL:

- [ ] **URL Updated** in KwikAPI dashboard
- [ ] **Test URL** responds with 200 OK
- [ ] **Small transaction** processed successfully
- [ ] **Callback received** within 30 seconds
- [ ] **Transaction status** updated automatically
- [ ] **Wallet balance** deducted correctly
- [ ] **Commission/cashback** added if applicable

## MONITORING

### Check for Pending Transactions
After the fix, monitor for any transactions that remain PENDING:

```sql
SELECT id, transaction_ref, amount, created_at, 
       EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_pending
FROM recharge_transactions 
WHERE status = 'PENDING' 
AND callback_received = false
ORDER BY created_at DESC;
```

### Recovery for Missed Callbacks
If any transactions are still PENDING after 1 hour, use the recovery script:
```bash
node scripts/recover-missed-callback.js <transaction_id> SUCCESS
```

## EXPECTED TIMELINE

### Immediate (0-5 minutes)
- Update callback URL in KwikAPI dashboard
- Test URL accessibility

### Short Term (5-30 minutes)
- Process test transaction
- Verify callback is received
- Confirm automatic status update

### Ongoing (30+ minutes)
- Monitor all new transactions
- Ensure real-time processing
- Check for any remaining PENDING transactions

## CONTACT INFORMATION

### KwikAPI Support
If you need help updating the callback URL:
- **Dashboard:** Login and update in settings
- **Support:** Contact KwikAPI technical support
- **Documentation:** Refer to callback configuration guide

### Emergency Contact
If callbacks still don't work after URL update:
1. Check server logs for incoming requests
2. Verify SSL certificate is valid
3. Ensure no firewall blocking KwikAPI IPs
4. Contact KwikAPI support for IP whitelist

## CRITICAL SUCCESS FACTORS

1. **Exact URL Match:** Use exactly `https://www.vighnahartaonlineservice.in/api/kwikapi-callback`
2. **HTTPS Required:** Must use HTTPS (not HTTP)
3. **Domain Spelling:** Ensure `vighnahartaonlineservice` (without 's')
4. **Endpoint Path:** Use `/api/kwikapi-callback` (not `/api/recharge/callback`)
5. **Test Immediately:** Process test transaction after configuration

## SUMMARY

**Root Cause:** Wrong callback URL in KwikAPI dashboard  
**Solution:** Update to correct URL with proper domain and endpoint  
**Impact:** All future transactions will process automatically  
**Timeline:** Fix can be implemented in 5 minutes  
**Testing:** Verify with small test transaction  

This single configuration change will resolve the callback issue and ensure all future transactions process correctly with real-time status updates and automatic wallet deductions.