# Wallet GST Double Calculation Fix

## Issue Identified
The user was seeing ₹104.04 for a ₹100 wallet recharge instead of the expected ₹102.00. This was caused by **double GST calculation**:

### Root Cause
1. **Frontend** calculated: ₹100 (base) + ₹2.00 (2% GST) = ₹102.00 (total)
2. **Frontend** sent ₹102.00 to backend as "amount"
3. **Backend** treated ₹102.00 as base amount and added GST: ₹102.00 + ₹2.04 (2% GST) = ₹104.04

### The Problem Flow
```
User Input: ₹100
↓
Frontend Calculation: ₹100 + ₹2.00 GST = ₹102.00
↓
Frontend sends ₹102.00 to backend
↓
Backend treats ₹102.00 as base amount
↓
Backend adds GST: ₹102.00 + ₹2.04 = ₹104.04 ❌
```

### The Correct Flow (After Fix)
```
User Input: ₹100
↓
Frontend Calculation: ₹100 + ₹2.00 GST = ₹102.00 (for display)
↓
Frontend sends ₹100 (base amount) to backend
↓
Backend calculates: ₹100 + ₹2.00 GST = ₹102.00 ✅
```

## Fix Applied

### File: `src/app/dashboard/wallet/page.tsx`

**Before:**
```typescript
await initiatePayment(
  breakdown.total_payable, // ❌ Sending total (₹102) instead of base (₹100)
```

**After:**
```typescript
await initiatePayment(
  breakdown.recharge_amount, // ✅ Sending base amount (₹100)
```

### Additional Changes
1. **Added debug logging** to track amount flow
2. **Updated success message** to show both wallet credit and total paid
3. **Verified backend GST calculation** is correct

## Testing

### Expected Behavior
For ₹100 wallet recharge:
- **User Input:** ₹100
- **Frontend Display:** Base ₹100 + GST ₹2.00 = Total ₹102.00
- **Backend Calculation:** Base ₹100 + GST ₹2.00 = Total ₹102.00
- **Cashfree Payment:** ₹102.00
- **Wallet Credit:** ₹100.00 (GST not credited to wallet)

### Test Cases
1. **₹100 recharge:** Should show ₹102.00 total (not ₹104.04)
2. **₹500 recharge:** Should show ₹510.00 total (not ₹520.40)
3. **₹1000 recharge:** Should show ₹1020.00 total (not ₹1040.40)

## Verification Steps
1. Clear browser cache
2. Go to wallet page
3. Enter ₹100 for recharge
4. Verify payment summary shows:
   - Base Amount: ₹100.00
   - GST (2%): ₹2.00
   - Total to Pay: ₹102.00
5. Proceed to Cashfree payment
6. Verify Cashfree shows ₹102.00 (not ₹104.04)

## Debug Information
The fix includes console logging to help track the amount flow:
```javascript
console.log('Payment Debug:', {
  inputAmount: amount,        // User input (₹100)
  baseAmount: breakdown.recharge_amount,  // Base amount (₹100)
  gstAmount: breakdown.gst_amount,        // GST amount (₹2.00)
  totalPayable: breakdown.total_payable,  // Total for display (₹102.00)
  sendingToBackend: breakdown.recharge_amount // Amount sent to backend (₹100)
});
```

## Impact
- **Fixed:** Double GST calculation issue
- **Maintained:** Correct GST display in UI (2%)
- **Ensured:** Only base amount is credited to wallet
- **Added:** Better debugging and user feedback