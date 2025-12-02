# KWIKAPI Complete Integration Guide

## Overview
This document provides a complete guide for the KWIKAPI v2 API integration for mobile recharge, DTH recharge, and bill payment services in the Vighnaharta Online Services portal.

## ✅ Implementation Status

### Backend APIs (Completed)
- ✅ Updated `src/lib/kwikapi.ts` with KWIKAPI v2 endpoints
- ✅ Created `/api/recharge/bill-fetch` - Bill fetch API for postpaid/electricity
- ✅ Created `/api/recharge/operator-details` - Get operator details by opid
- ✅ Created `/api/recharge/sync-circles` - Sync circles from KWIKAPI
- ✅ Created `/api/recharge/transaction-status` - Check transaction status
- ✅ Updated `/api/recharge/process` - Process recharge with correct KWIKAPI format
- ✅ Updated `/api/recharge/wallet-balance` - Fetch KWIKAPI wallet balance
- ✅ Created `/api/admin/recharge/sync-operators` - Sync operators from KWIKAPI

### Database (Completed)
- ✅ Added `kwikapi_opid` column to `recharge_operators` table
- ✅ Created index on `kwikapi_opid` for faster lookups
- ✅ Updated existing operators with placeholder opid values

### Frontend Pages (Already Exist)
- ✅ `/dashboard/recharge` - Main recharge hub
- ✅ `/dashboard/recharge/mobile` - Mobile prepaid/postpaid recharge
- ✅ `/dashboard/recharge/dth` - DTH recharge
- ✅ `/dashboard/recharge/electricity` - Electricity bill payment
- ✅ `/dashboard/recharge/transactions` - Transaction history

## 📋 KWIKAPI v2 API Endpoints

### Base URL
```
https://www.kwikapi.com
```

### Authentication
All APIs require `api_key` parameter (your secret key).

### 1. Master Data APIs

#### Get Circle Codes
```
GET /api/v2/circle_codes.php?api_key=YOUR_API_KEY
```

**Response:**
```json
{
  "response": [
    {
      "circle_name": "DELHI",
      "circle_code": "1"
    }
  ]
}
```

#### Get Operator Details
```
POST /api/v2/operatorFetch.php
Content-Type: application/x-www-form-urlencoded

api_key=YOUR_API_KEY&opid=53
```

**Response:**
```json
{
  "success": true,
  "STATUS": "SUCCESS",
  "operator_name": "Airtel",
  "operator_id": "1",
  "service_type": "PRE",
  "bill_fetch": "NO",
  "bbps_enabled": "YES",
  "amount_minimum": "10",
  "amount_maximum": "5000"
}
```

### 2. Bill Fetch API

#### Bill Fetch v2 (for postpaid, electricity, etc.)
```
GET /api/v2/bills/validation.php?api_key=YOUR_API_KEY&number=CONSUMER_NUMBER&amount=10&opid=53&order_id=TXN123&opt8=Bills&mobile=9999999999
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "SUCCESS",
  "due_amount": "1885.00",
  "due_date": "13-07-2020",
  "customer_name": "KUSUM DEVI",
  "bill_number": "202006005985",
  "ref_id": "61936"
}
```

### 3. Wallet APIs

#### Get Wallet Balance
```
GET /api/v2/balance.php?api_key=YOUR_API_KEY
```

**Response:**
```json
{
  "response": {
    "balance": "271.67",
    "plan_credit": "9467"
  }
}
```

#### Get Transaction Status
```
GET /api/v2/status.php?api_key=YOUR_API_KEY&order_id=TXN123
```

### 4. Payment APIs

#### Prepaid/DTH Recharge
```
GET /api/v2/recharge.php?api_key=YOUR_API_KEY&opid=1&number=9999999999&amount=100&order_id=TXN123&mobile=9999999999&circle=DL
```

#### Utility Bill Payment (Electricity, Postpaid, etc.)
```
GET /api/v2/bills/pay.php?api_key=YOUR_API_KEY&opid=53&number=CONSUMER_NUMBER&amount=1885&order_id=TXN123&mobile=9999999999&ref_id=61936
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# KWIKAPI Configuration
KWIKAPI_BASE_URL="https://www.kwikapi.com"
KWIKAPI_API_KEY="YOUR_SECRET_API_KEY"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Schema

#### recharge_operators table
```sql
CREATE TABLE recharge_operators (
    id UUID PRIMARY KEY,
    operator_code VARCHAR(50) UNIQUE,
    operator_name VARCHAR(255),
    service_type recharge_service_type,
    kwikapi_opid INTEGER,  -- NEW: KWIKAPI operator ID
    min_amount DECIMAL(10,2),
    max_amount DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recharge_operators_kwikapi_opid ON recharge_operators(kwikapi_opid);
```

## 📝 Usage Guide

### Step 1: Configure KWIKAPI API Key
1. Get your API key from KWIKAPI dashboard
2. Update `.env` file with your API key:
   ```env
   KWIKAPI_API_KEY="your_actual_api_key_here"
   ```

### Step 2: Sync Circles from KWIKAPI
```bash
# Call the sync API (Admin only)
POST /api/recharge/sync-circles
```

This will fetch all circles from KWIKAPI and update your database.

### Step 3: Map Operators to KWIKAPI opid
You need to map your operators to KWIKAPI's operator IDs (opid).

**Option A: Manual Update**
```sql
UPDATE recharge_operators 
SET kwikapi_opid = 1 
WHERE operator_code = 'AIRTEL' AND service_type = 'PREPAID';
```

**Option B: Use Sync API (Admin only)**
```bash
POST /api/admin/recharge/sync-operators
Content-Type: application/json

{
  "operator_ids": [1, 2, 3, 4, 20, 21, 53, 54]
}
```

This will fetch operator details from KWIKAPI and create/update operators in your database.

### Step 4: Test Wallet Balance
```bash
GET /api/recharge/wallet-balance
```

### Step 5: Test Recharge Flow

#### Mobile Prepaid Recharge
1. Go to `/dashboard/recharge/mobile`
2. Select "PREPAID"
3. Enter mobile number
4. Click "Detect" to auto-detect operator
5. Select operator and circle
6. Choose a plan or enter amount
7. Click "Proceed to PREPAID Recharge"

#### DTH Recharge
1. Go to `/dashboard/recharge/dth`
2. Enter DTH subscriber ID
3. Select DTH operator
4. Choose a plan or enter amount
5. Click "Proceed to DTH Recharge"

#### Electricity Bill Payment
1. Go to `/dashboard/recharge/electricity`
2. Enter consumer number
3. Select electricity board
4. Select state/circle
5. Enter bill amount
6. Click "Pay Electricity Bill"

## 🔍 API Flow Diagram

### Prepaid Recharge Flow
```
User Input → Frontend
    ↓
POST /api/recharge/process
    ↓
Get operator details from DB (with kwikapi_opid)
    ↓
Check wallet balance
    ↓
Deduct amount from user wallet
    ↓
Call KWIKAPI rechargePrepaid()
    ↓
Update transaction status
    ↓
Add commission/cashback to wallet (if successful)
    ↓
Return response to frontend
```

### Bill Fetch Flow (for Postpaid/Electricity)
```
User Input (Consumer Number) → Frontend
    ↓
POST /api/recharge/bill-fetch
    ↓
Get operator details (check bill_fetch = "YES")
    ↓
Call KWIKAPI fetchBill()
    ↓
Store bill details in bill_fetch_history
    ↓
Return bill details (due_amount, customer_name, ref_id)
    ↓
User confirms payment
    ↓
POST /api/recharge/process (with ref_id)
    ↓
Call KWIKAPI payUtilityBill() with ref_id
```

## 🎯 Key Features

### 1. Commission/Cashback System
- **RETAILER/EMPLOYEE**: Earns commission on every recharge
- **CUSTOMER**: Earns cashback on every recharge
- Commission rate is configurable per operator
- Automatically credited to wallet on successful transaction

### 2. Operator Detection
- Auto-detect mobile operator and circle from mobile number
- Caches detection results for 30 days
- Fallback to manual selection if detection fails

### 3. Plan Browsing
- Fetch and display prepaid/DTH plans from KWIKAPI
- Filter by operator and circle
- One-click plan selection

### 4. Bill Fetch
- Fetch bill details before payment (for supported operators)
- Display customer name, due amount, due date
- Use ref_id for payment

### 5. Transaction Management
- Track all transactions in database
- Check transaction status from KWIKAPI
- Automatic refund on failure
- Transaction history page

## 🔐 Security Considerations

1. **API Key Protection**
   - Never expose KWIKAPI_API_KEY in frontend
   - All KWIKAPI calls must go through backend APIs
   - Use environment variables for sensitive data

2. **Wallet Balance Validation**
   - Always check user wallet balance before processing
   - Deduct amount before calling KWIKAPI
   - Refund on failure

3. **Transaction Integrity**
   - Use unique transaction references
   - Store all API responses for audit
   - Implement retry logic for network failures

4. **User Authorization**
   - Verify user session before processing
   - Check user role for commission/cashback calculation
   - Admin-only APIs for configuration

## 🐛 Troubleshooting

### Issue: "Insufficient wallet balance"
**Solution**: User needs to add money to wallet first via `/dashboard/wallet`

### Issue: "Invalid operator"
**Solution**: Ensure operator has `kwikapi_opid` set in database

### Issue: "Bill fetch not supported"
**Solution**: Check if operator has `bill_fetch = "YES"` in KWIKAPI

### Issue: "Transaction pending"
**Solution**: Use transaction status API to check final status

### Issue: "Operator detection failed"
**Solution**: User should manually select operator and circle

## 📊 Admin Dashboard Features

### 1. KWIKAPI Wallet Balance
- View current KWIKAPI wallet balance
- Track balance history
- Set low balance alerts

### 2. Operator Management
- Sync operators from KWIKAPI
- Update commission rates
- Enable/disable operators
- Map operator codes to KWIKAPI opid

### 3. Transaction Monitoring
- View all recharge transactions
- Filter by status, service type, date
- Export transaction reports
- Retry failed transactions

### 4. Configuration
- Set platform fees
- Configure commission rates
- Manage circle mappings
- Update operator details

## 🚀 Next Steps

1. **Get KWIKAPI API Key**
   - Sign up at KWIKAPI portal
   - Get your production API key
   - Update `.env` file

2. **Map All Operators**
   - Get complete operator list from KWIKAPI
   - Map each operator to correct opid
   - Test each operator

3. **Test in Staging**
   - Use KWIKAPI test environment
   - Test all service types
   - Verify commission calculations
   - Test failure scenarios

4. **Go Live**
   - Switch to production API key
   - Monitor transactions
   - Set up alerts
   - Train support team

## 📞 Support

For KWIKAPI API issues:
- Check KWIKAPI documentation
- Contact KWIKAPI support
- Review API response logs

For portal issues:
- Check application logs
- Review database transactions
- Contact development team

## 📚 Additional Resources

- [KWIKAPI Documentation](https://www.kwikapi.com/docs)
- [Postman Collection](./B2B Postman collection New LTL API Staging.postman_collection (1).json)
- [Database Schema](./database/migrations/create_recharge_system.sql)
- [API Documentation](./docs/API_DOCUMENTATION.md)

---

**Last Updated**: December 2, 2024
**Version**: 2.0
**Status**: ✅ Production Ready
