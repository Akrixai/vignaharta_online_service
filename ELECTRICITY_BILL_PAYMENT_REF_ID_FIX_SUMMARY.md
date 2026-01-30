# Electricity Bill Payment ref_id Issue Fix

## Problem Description
KwikAPI team reported: "We have found an issue with the payment you are trying to make, which has a different bill fetch ID. Please initiate a fresh hit using the exact bill fetch 'ref_id' id while hitting the payments api 'reference_id'."

## Root Cause Analysis
1. **Each bill fetch generates a new `ref_id`** - KwikAPI creates unique reference IDs for each bill validation call
2. **Frontend caching issue** - Users might fetch bill multiple times, but payment uses old `ref_id`
3. **Session management missing** - No tracking of which `ref_id` should be used for payment
4. **Timing issues** - `ref_id` expires or becomes invalid between bill fetch and payment

## Solution Implemented

### 1. Database Changes
- **New table**: `bill_fetch_sessions` to track ref_id usage
- **Session expiry**: 30-minute expiration to prevent stale ref_id usage
- **Usage tracking**: Mark sessions as used to prevent reuse
- **Cleanup function**: Automatic cleanup of expired sessions

### 2. Backend API Updates

#### Bill Fetch API (`/api/kwikapi/bill-fetch`)
- **Session storage**: Store each successful bill fetch with ref_id
- **Cleanup old sessions**: Remove previous sessions for same user/consumer
- **Expiry management**: Set 30-minute expiration for each session

#### Bill Payment API (`/api/kwikapi/bill-payment`)
- **Session lookup**: Find most recent valid session for user/consumer
- **Fresh ref_id**: Use ref_id from valid session
- **Automatic bill fetch**: If no valid session, attempt fresh bill fetch
- **Session marking**: Mark session as used after payment attempt

### 3. Frontend Updates

#### Electricity Bill Payment Page
- **Fresh bill fetch before payment**: Automatically fetch fresh bill details before payment
- **Better error handling**: Show clear messages about ref_id issues
- **Session awareness**: Handle cases where backend fetches fresh data

## Key Features

### 1. Session Management
```sql
CREATE TABLE bill_fetch_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    consumer_number VARCHAR NOT NULL,
    ref_id VARCHAR NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_for_payment BOOLEAN DEFAULT FALSE
);
```

### 2. Automatic Fresh Bill Fetch
- Backend automatically fetches fresh bill if no valid session
- Frontend can also trigger fresh fetch before payment
- Ensures ref_id is always current and valid

### 3. Error Prevention
- Expired sessions are automatically cleaned up
- Multiple bill fetches don't interfere with each other
- Clear logging for debugging ref_id issues

## API Flow

### Bill Fetch Flow
1. User clicks "Get Bill Details"
2. Frontend calls `/api/kwikapi/bill-fetch`
3. Backend calls KwikAPI bill validation
4. Backend stores session with ref_id (30min expiry)
5. Frontend displays bill details

### Payment Flow
1. User clicks "Pay Bill"
2. Frontend calls `/api/kwikapi/bill-payment`
3. Backend looks for valid session with ref_id
4. If found: Use stored ref_id
5. If not found: Attempt fresh bill fetch
6. Backend calls KwikAPI payment with correct ref_id
7. Mark session as used

## Error Handling

### Ref_id Mismatch
- Backend automatically attempts fresh bill fetch
- Clear error messages to user
- Logging for debugging

### Session Expiry
- 30-minute expiration prevents stale ref_id usage
- Automatic cleanup of expired sessions
- Fresh bill fetch if session expired

### Multiple Bill Fetches
- Each new bill fetch creates new session
- Old sessions for same consumer are cleaned up
- Latest ref_id is always used

## Testing Scenarios

### 1. Normal Flow
- Fetch bill → Pay immediately ✅
- Should use stored ref_id from session

### 2. Multiple Fetches
- Fetch bill → Fetch again → Pay ✅
- Should use latest ref_id

### 3. Expired Session
- Fetch bill → Wait 31 minutes → Pay ✅
- Should automatically fetch fresh bill

### 4. No Initial Fetch
- Go directly to payment ✅
- Should automatically fetch bill first

## Monitoring & Debugging

### Database Queries
```sql
-- Check active sessions
SELECT * FROM bill_fetch_sessions 
WHERE expires_at > now() AND used_for_payment = false;

-- Check session usage
SELECT 
  bfs.ref_id,
  bfs.used_for_payment,
  rt.status,
  rt.kwikapi_message
FROM bill_fetch_sessions bfs
LEFT JOIN recharge_transactions rt ON rt.bill_fetch_session_id = bfs.id
ORDER BY bfs.created_at DESC;
```

### Cleanup Endpoint
- `/api/kwikapi/cleanup-sessions` - Manual cleanup trigger
- Automatic cleanup via database function

## Benefits

1. **Eliminates ref_id mismatch errors** - Always uses fresh, valid ref_id
2. **Better user experience** - Automatic handling of session issues
3. **Improved reliability** - Robust error handling and recovery
4. **Clear debugging** - Comprehensive logging and tracking
5. **Scalable solution** - Handles multiple users and concurrent requests

## Files Modified

### Database
- `database/migrations/fix_electricity_bill_payment_ref_id_issue.sql`

### Backend APIs
- `src/app/api/kwikapi/bill-fetch/route.ts`
- `src/app/api/kwikapi/bill-payment/route.ts`
- `src/app/api/kwikapi/cleanup-sessions/route.ts` (new)

### Frontend
- `src/app/dashboard/recharge/electricity/page.tsx`

## Deployment Notes

1. **Apply database migration** first
2. **Deploy backend changes** 
3. **Deploy frontend changes**
4. **Test with real KwikAPI calls**
5. **Monitor session table** for proper cleanup

This fix ensures that electricity bill payments always use the correct, fresh ref_id from KwikAPI, eliminating the "different bill fetch ID" error reported by the KwikAPI team.