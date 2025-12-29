# InsPay Callback Configuration Analysis

## Current Configuration Status

Based on the codebase analysis, here are the current callback and redirection URL configurations for your InsPay PAN services:

### 1. Server to Server Call Back URL (Webhook)
**Current Configuration**: `https://www.vighnahartaonlineservice.in/api/pan-services/callback`

**Status**: ✅ **CORRECTLY CONFIGURED**

**Implementation Details**:
- **Route**: `src/app/api/pan-services/callback/route.ts`
- **Methods**: Both GET and POST supported
- **Parameters Handled**:
  - `txid` = Unique order ID provided by you on every transaction
  - `status` = Success / Failure / Pending
  - `opid` = Operator ID

**Callback Processing**:
```
✅ SUCCESS: Adds commission to wallet + creates commission transaction
⏳ PENDING: Updates status to pending (no action)
❌ FAILURE: Processes automatic refund + creates refund transaction
```

### 2. Pan Card Redirection URL
**Recommended Configuration**: `https://www.vighnahartaonlineservice.in/dashboard/pan-services/history`

**Status**: ⚠️ **NEEDS TO BE CONFIGURED IN INSPAY DASHBOARD**

**Purpose**: After completing PAN application on InsPay portal, user will be redirected to this URL to view their application status.

## Dashboard Screenshots Analysis

Based on the screenshot you provided showing the InsPay configuration panel:

### Current Settings Visible:
- **Server to server Call Back URL**: `https://www.vighnahartaonlineservice.in/api/pan-services/callback` ✅
- **Pan Card Redirection URL**: `https://www.vighnahartaonlineservice.in/api/pan-services/callback` ❌

### Required Changes:
The **Pan Card Redirection URL** should be changed from:
```
❌ https://www.vighnahartaonlineservice.in/api/pan-services/callback
```

To:
```
✅ https://www.vighnahartaonlineservice.in/dashboard/pan-services/history
```

## Implementation Status

### ✅ Completed Features:

1. **Instant Payment Deduction**: Wallet amount debited immediately when "Start Application" is clicked
2. **Real-time Webhook Processing**: Handles Success/Failure/Pending status updates
3. **Automatic Refund System**: Processes refunds on failure or 24-hour expiry
4. **Commission Management**: Adds commission to wallet on successful completion
5. **Order Tracking**: Order ID visible immediately in PAN services history
6. **24-hour Expiry Tracking**: Cron job processes expired applications

### 🔧 Configuration Required:

1. **Update Pan Card Redirection URL** in InsPay dashboard to:
   ```
   https://www.vighnahartaonlineservice.in/dashboard/pan-services/history
   ```

2. **Verify Callback URL** is correctly set to:
   ```
   https://www.vighnahartaonlineservice.in/api/pan-services/callback
   ```

## Callback Parameters Explanation

When InsPay sends callbacks to your server, the following parameters are included:

```javascript
// GET method callback format:
https://www.vighnahartaonlineservice.in/api/pan-services/callback?txid=YOUR_ORDER_ID&status=Success&opid=OPERATOR_ID

// Parameters:
{
  "txid": "Unique order ID provided by you on every transaction",
  "status": "Success / Failure / Pending", 
  "opid": "Operator ID from InsPay"
}
```

## Updated Dashboard Features

### 1. Apply Service Page (Direct Links)
- ✅ Updated tab names to professional government-style:
  - 📋 Digital Service Registry
  - 🏛️ Government Portal Access  
  - 🔐 Authorized Service Links
  - 📊 Link Analytics Dashboard

### 2. Sidebar Menu Fix
- ✅ Fixed "Manage Direct Links" menu visibility for Admin and Employee roles
- ✅ Updated menu item name from "Direct Links Management" to "Manage Direct Links"

### 3. Dashboard PAN Service Icons
- ✅ Updated PAN service cards with new icons and live status:
  - 🆔 **Apply New PAN** (Live) → `/dashboard/pan-services/new`
  - ✏️ **PAN Correction** (Live) → `/dashboard/pan-services/correction`  
  - 📋 **Incomplete PAN** (Live) → `/dashboard/pan-services/incomplete`

## Next Steps

1. **Login to InsPay Dashboard**
2. **Navigate to Callback Configuration**
3. **Update Pan Card Redirection URL** to: `https://www.vighnahartaonlineservice.in/dashboard/pan-services/history`
4. **Verify Server to Server Call Back URL** is: `https://www.vighnahartaonlineservice.in/api/pan-services/callback`
5. **Test the complete flow** with a small transaction

## Testing Callback

You can test the callback functionality using:

```bash
# Test Success Callback
curl -X GET "https://www.vighnahartaonlineservice.in/api/pan-services/callback?txid=TEST123&status=Success&opid=OP123"

# Test Failure Callback  
curl -X GET "https://www.vighnahartaonlineservice.in/api/pan-services/callback?txid=TEST123&status=Failure&opid=OP123"
```

## Summary

Your callback system is properly implemented and ready. You just need to update the **Pan Card Redirection URL** in the InsPay dashboard to redirect users to the history page instead of the callback API endpoint.