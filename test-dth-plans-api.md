# DTH Plans API Test - UPDATED

## Issue
DTH recharge page was not showing plans for two reasons:
1. The API was not sending the `state_code` parameter (FIXED)
2. **KWIKAPI account is not authorized to fetch DTH plans** (ACCOUNT LIMITATION)

## Root Cause
The code in `src/app/api/recharge/plans/route.ts` was explicitly NOT sending `state_code` for DTH services:

```typescript
// OLD CODE (INCORRECT)
if (circleCode && !isDTH) {
  formData.append('state_code', circleCode);
}
```

This was based on the assumption that DTH doesn't need circles, but according to KWIKAPI Postman documentation:
- **"Using this api you can fetch all prepaid, dth recharge plans."**
- The API expects `state_code` parameter for both prepaid AND DTH

## Fix Applied

### 1. Updated API Route (`src/app/api/recharge/plans/route.ts`)
- Now sends `state_code` for DTH if provided
- Allows DTH requests without `state_code` as fallback

### 2. Updated DTH Page (`src/app/dashboard/recharge/dth/page.tsx`)
- Now sends `circle_code: '1'` (Delhi) as default for DTH
- DTH plans are typically nationwide, so any circle should work

## Testing

### Test with Tata Sky (opid: 20)
```bash
curl --location 'https://www.kwikapi.com/api/v2/recharge_plans.php' \
--form 'api_key="YOUR_API_KEY"' \
--form 'state_code="1"' \
--form 'opid="20"'
```

### Test with Dish TV (opid: 6)
```bash
curl --location 'https://www.kwikapi.com/api/v2/recharge_plans.php' \
--form 'api_key="YOUR_API_KEY"' \
--form 'state_code="1"' \
--form 'opid="6"'
```

### Test with Airtel DTH (opid: 23)
```bash
curl --location 'https://www.kwikapi.com/api/v2/recharge_plans.php' \
--form 'api_key="YOUR_API_KEY"' \
--form 'state_code="1"' \
--form 'opid="23"'
```

## Expected Result
DTH plans should now display properly on the DTH recharge page, showing available recharge amounts with validity and descriptions, similar to how mobile prepaid plans are displayed.

## Verification Steps
1. Navigate to `/dashboard/recharge/dth`
2. Select a DTH operator (e.g., Tata Sky, Dish TV, Airtel DTH)
3. Plans should load and display in categories
4. Check browser console for API logs showing successful plan fetch

## Notes
- DTH plans may vary by operator
- Some DTH operators might not have plans available through the API
- If no plans are returned, the page will show suggested amounts (₹100, ₹200, ₹300, ₹500, ₹1000)


---

## IMPORTANT: KWIKAPI Account Authorization Issue

### Current Status
The KWIKAPI API is returning:
```json
{
  "success": true,
  "operator": "VIDEOCON D2H",
  "plans": {
    "msg": "You are not authorize."
  }
}
```

### What This Means
Your KWIKAPI account **does not have permission** to fetch DTH recharge plans. This is a subscription/plan limitation with KWIKAPI, not a code issue.

### Solution Options

#### Option 1: Contact KWIKAPI Support (Recommended)
Contact KWIKAPI support to:
- Upgrade your account to include DTH plan browsing
- Enable DTH plan API access
- Verify your account permissions

**KWIKAPI Support:**
- Check their documentation for contact details
- May require account upgrade or additional fees

#### Option 2: Use Custom Amount Entry (Current Workaround)
The application already handles this gracefully:
- Users can enter custom DTH recharge amounts
- Suggested amounts are shown (₹100, ₹200, ₹300, ₹500, ₹1000)
- DTH recharge still works, just without plan browsing

### Code Changes Made
Updated `src/app/api/recharge/plans/route.ts` to:
1. Send `state_code` parameter for DTH (as per KWIKAPI docs)
2. Detect authorization errors in the response
3. Show user-friendly message when plans aren't available

### Testing Results
✅ API call is working correctly
✅ Parameters are being sent properly
❌ KWIKAPI account lacks DTH plan browsing permission

### Next Steps
1. **Contact KWIKAPI** to enable DTH plan browsing on your account
2. Once enabled, DTH plans will automatically appear
3. No additional code changes needed

### Alternative: Check Mobile Prepaid Plans
To verify the API is working for authorized services:
```bash
# Test with Jio Prepaid (should work if authorized)
curl --location 'https://www.kwikapi.com/api/v2/recharge_plans.php' \
--form 'api_key="YOUR_API_KEY"' \
--form 'state_code="1"' \
--form 'opid="8"'
```

If mobile prepaid plans work but DTH doesn't, it confirms the authorization issue.
