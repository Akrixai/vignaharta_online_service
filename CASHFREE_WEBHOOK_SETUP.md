# Cashfree Webhook Configuration Guide

## Problem
Payments are being created but not updating wallet because Cashfree webhook is not configured.

## Solution: Configure Webhook in Cashfree Dashboard

### Step 1: Login to Cashfree Dashboard
1. Go to https://merchant.cashfree.com/merchants/login
2. Login with your credentials

### Step 2: Navigate to Developers Section
1. Click on "Developers" in the left sidebar
2. Click on "Webhooks"

### Step 3: Add Webhook URL
1. Click "Add Webhook" or "Configure Webhook"
2. Enter your webhook URL:
   ```
   https://yourdomain.com/api/wallet/cashfree/webhook
   ```
   For local testing with ngrok:
   ```
   https://your-ngrok-url.ngrok.io/api/wallet/cashfree/webhook
   ```

### Step 4: Select Events
Select these events:
- ✅ PAYMENT_SUCCESS_WEBHOOK
- ✅ PAYMENT_FAILED_WEBHOOK
- ✅ PAYMENT_USER_DROPPED_WEBHOOK (optional)

### Step 5: Get Webhook Secret
1. After saving, Cashfree will show you a **Webhook Secret**
2. Copy this secret
3. Add it to your `.env` file:
   ```env
   CASHFREE_WEBHOOK_SECRET="your_webhook_secret_here"
   ```

### Step 6: Test Webhook
1. Make a test payment of ₹1
2. Check if webhook is received in your logs
3. Verify wallet balance updates

## For Local Development (Using ngrok)

If testing locally, you need ngrok:

1. Install ngrok: https://ngrok.com/download
2. Run your Next.js app: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the ngrok URL (e.g., https://abc123.ngrok.io)
5. Use this URL in Cashfree webhook configuration:
   ```
   https://abc123.ngrok.io/api/wallet/cashfree/webhook
   ```

## Verify Webhook is Working

Check your server logs for:
```
Payment successful: ORDER_xxx, Amount: ₹11
```

If you see this, webhook is working correctly!

## Current Issue
Your payments show status "CREATED" which means webhook was never called.
After configuring webhook properly, new payments will automatically update wallet balance.

---

## Manual Fix for Existing Payments

If you want to manually mark existing payments as paid (for testing), contact admin to run SQL update.
**DO NOT do this in production without verifying actual payment!**
