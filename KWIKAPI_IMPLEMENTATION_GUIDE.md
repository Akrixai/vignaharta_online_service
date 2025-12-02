# KWIKAPI Recharge & Bill Payment System - Complete Implementation Guide

## 🎯 Overview

A professional, production-ready integration of KWIKAPI v3.0.0 for mobile recharges (Prepaid/Postpaid), DTH recharges, and electricity bill payments with commission tracking, wallet management, and transaction history.

## ✨ Features Implemented

### 1. **Multi-Service Support**
- ✅ Prepaid Mobile Recharge
- ✅ Postpaid Bill Payment
- ✅ DTH Recharge
- ✅ Electricity Bill Payment
- ✅ Automatic Operator Detection
- ✅ Real-time Plan Fetching

### 2. **Smart Features**
- 🔍 Auto-detect operator and circle from mobile number
- 📋 Browse and select from available plans
- 💰 Real-time commission calculation
- 🔄 Automatic refund on failure
- 📊 Comprehensive transaction history
- 💳 Wallet balance management

### 3. **Admin Dashboard**
- 📈 KWIKAPI wallet balance monitoring
- ⚠️ Low balance alerts
- 📊 Transaction analytics
- 🔧 API configuration status

## 📁 Files Created

### Database
```
database/migrations/create_recharge_system.sql
```
- Complete schema for recharge system
- Operators, circles, plans, transactions tables
- KWIKAPI wallet tracking
- Bill fetch history
- Operator detection cache

### Backend APIs
```
src/lib/kwikapi.ts                              # KWIKAPI client library
src/app/api/recharge/wallet-balance/route.ts   # Wallet balance API
src/app/api/recharge/operators/route.ts         # Operators list API
src/app/api/recharge/circles/route.ts           # Circles list API
src/app/api/recharge/detect-operator/route.ts   # Operator detection API
src/app/api/recharge/plans/route.ts             # Plans fetch API
src/app/api/recharge/process/route.ts           # Main recharge processing API
src/app/api/recharge/callback/route.ts          # KWIKAPI webhook callback
src/app/api/recharge/transactions/route.ts      # Transaction history API
```

### Frontend Pages
```
src/app/dashboard/recharge/page.tsx                    # Main recharge page
src/app/dashboard/recharge/transactions/page.tsx       # Transaction history
src/app/dashboard/admin/kwikapi-wallet/page.tsx        # Admin wallet dashboard
```

## 🚀 Installation Steps

### Step 1: Database Migration

Run the migration using Supabase MCP:

```sql
-- Execute the migration file
-- This will create all necessary tables and seed initial data
```

Or use the MCP tool:
```javascript
mcp_supabase_apply_migration({
  name: "create_recharge_system",
  query: "/* SQL from create_recharge_system.sql */"
})
```

### Step 2: Environment Configuration

Add to your `.env` file:

```env
# KWIKAPI Configuration
KWIKAPI_BASE_URL="https://api.kwikapi.com/v3"
KWIKAPI_API_KEY="your_actual_kwikapi_api_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Change to production URL
```

**Important:** Replace `your_actual_kwikapi_api_key` with your real KWIKAPI API key.

### Step 3: Install Dependencies

The system uses existing dependencies. Verify these are installed:

```bash
npm install axios @supabase/supabase-js next-auth
```

### Step 4: Update Navigation

Add recharge links to your dashboard navigation:

```tsx
// In your dashboard layout or navigation component
<Link href="/dashboard/recharge">
  📱 Recharge & Bills
</Link>

<Link href="/dashboard/recharge/transactions">
  📊 Recharge History
</Link>

// For admin only
<Link href="/dashboard/admin/kwikapi-wallet">
  💰 KWIKAPI Wallet
</Link>
```

## 📱 User Flow

### For Retailers/Users

1. **Navigate to Recharge Page**
   - Go to `/dashboard/recharge`
   - Select service type (Prepaid/Postpaid/DTH/Electricity)

2. **Enter Details**
   - For Prepaid/Postpaid: Enter mobile number → Click "Detect" to auto-detect operator
   - For DTH: Enter DTH subscriber ID
   - For Electricity: Enter consumer number

3. **Select Operator & Circle**
   - Auto-filled if detected, or select manually
   - View commission rate for each operator

4. **Browse Plans (Optional)**
   - Plans load automatically based on operator and circle
   - Click on a plan to auto-fill amount
   - View plan details (data, voice, SMS, validity)

5. **Enter Amount & Submit**
   - Enter custom amount or use plan amount
   - Add customer name (optional)
   - Click "Proceed to Recharge"

6. **Transaction Processing**
   - Amount deducted from wallet
   - Real-time processing with KWIKAPI
   - Success: Commission credited automatically
   - Failure: Automatic refund to wallet

7. **View History**
   - Go to `/dashboard/recharge/transactions`
   - Filter by status or service type
   - View commission earned

### For Admin

1. **Monitor Wallet Balance**
   - Go to `/dashboard/admin/kwikapi-wallet`
   - View total, blocked, and available balance
   - Get low balance alerts

2. **Refresh Balance**
   - Click "Refresh Balance" to sync with KWIKAPI
   - View last update timestamp

3. **View All Transactions**
   - Access transaction history
   - See all users' recharge transactions
   - Monitor success/failure rates

## 💡 Key Features Explained

### 1. Operator Detection
```typescript
// Automatically detects operator and circle from mobile number
// Caches results for 30 days to reduce API calls
// Falls back to manual selection if detection fails
```

### 2. Commission System
```typescript
// Commission rates stored per operator
// Automatically calculated: (amount × commission_rate) / 100
// Credited to wallet only on successful transactions
// Visible in transaction history
```

### 3. Wallet Management
```typescript
// User wallet balance checked before transaction
// Amount + platform fee (₹2) deducted upfront
// Commission added back on success
// Full refund on failure
```

### 4. Transaction States
- **PENDING**: Transaction initiated, waiting for response
- **SUCCESS**: Recharge successful, commission credited
- **FAILED**: Recharge failed, amount refunded
- **REFUNDED**: Manual refund processed

### 5. Platform Fee
```typescript
// ₹2 platform fee per transaction
// Added to total amount
// Covers operational costs
```

## 🎨 UI/UX Highlights

### Modern Design
- ✨ Gradient cards for visual appeal
- 🎯 Service type tabs for easy navigation
- 📱 Responsive design for all devices
- 🎨 Color-coded status badges
- 💫 Smooth transitions and hover effects

### User-Friendly Features
- 🔍 Auto-detect operator (saves time)
- 📋 Visual plan cards with all details
- 💰 Real-time commission display
- ✅ Success/error messages with emojis
- 📊 Transaction summary cards

### Professional Touch
- 🎯 Clean, organized layout
- 📱 Mobile-first responsive design
- ⚡ Fast loading with optimized queries
- 🔒 Secure transaction processing
- 📈 Analytics and insights

## 🔧 API Endpoints

### Public APIs (Authenticated Users)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recharge/operators` | GET | List all operators by service type |
| `/api/recharge/circles` | GET | List all circles |
| `/api/recharge/detect-operator` | POST | Detect operator from mobile number |
| `/api/recharge/plans` | GET | Fetch plans for operator/circle |
| `/api/recharge/process` | POST | Process recharge/bill payment |
| `/api/recharge/transactions` | GET | Get transaction history |

### Admin APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recharge/wallet-balance` | GET | Get KWIKAPI wallet balance |
| `/api/recharge/callback` | POST | KWIKAPI webhook callback |

## 🔐 Security Features

1. **Authentication Required**
   - All APIs require valid session
   - User-specific transaction access
   - Admin-only wallet management

2. **Input Validation**
   - Mobile number format validation
   - Amount range validation per operator
   - Required field checks

3. **Transaction Safety**
   - Unique transaction references
   - Duplicate transaction prevention
   - Automatic refund on failure

4. **Wallet Protection**
   - Balance check before transaction
   - Atomic wallet operations
   - Transaction logging

## 📊 Database Schema

### Key Tables

**recharge_operators**
- Stores all operators (Prepaid, Postpaid, DTH, Electricity)
- Commission rates per operator
- Min/max amount limits

**recharge_circles**
- All Indian telecom circles
- Used for mobile operators

**recharge_plans**
- Cached plans from KWIKAPI
- Linked to operators and circles
- Updated on each fetch

**recharge_transactions**
- Complete transaction history
- Links to users, operators, circles
- Stores KWIKAPI response data
- Commission tracking

**kwikapi_wallet**
- Single row for wallet balance
- Synced with KWIKAPI
- Last update timestamp

**operator_detection_cache**
- Caches operator detection results
- 30-day expiry
- Reduces API calls

## 🎯 Commission Structure

Default commission rates (can be customized per operator):

| Service Type | Commission Rate |
|--------------|----------------|
| Prepaid | 2.0% - 3.0% |
| Postpaid | 1.0% - 1.5% |
| DTH | 2.0% |
| Electricity | 1.0% |

**Example:**
- Recharge Amount: ₹499
- Commission Rate: 2.5%
- Commission Earned: ₹12.48
- Platform Fee: ₹2.00
- Total Deducted: ₹501.00
- Net Earning: ₹10.48

## 🚨 Error Handling

### Common Errors

1. **Insufficient Balance**
   - Message: "Insufficient wallet balance"
   - Action: User needs to add funds

2. **Invalid Operator**
   - Message: "Invalid operator"
   - Action: Select valid operator from list

3. **Amount Out of Range**
   - Message: "Amount must be between ₹X and ₹Y"
   - Action: Enter valid amount

4. **Operator Down**
   - Message: "Operator service unavailable"
   - Action: Retry after some time

5. **API Error**
   - Message: Error from KWIKAPI
   - Action: Automatic refund processed

## 📈 Analytics & Reporting

### Transaction Metrics
- Total transactions by status
- Success rate percentage
- Total commission earned
- Service type distribution

### Wallet Metrics
- Current balance
- Blocked amount
- Available balance
- Low balance alerts

## 🔄 Webhook Integration

KWIKAPI sends callbacks to:
```
POST /api/recharge/callback
```

**Callback Handling:**
1. Receives transaction status update
2. Updates transaction in database
3. Credits commission if SUCCESS
4. Processes refund if FAILED
5. Sends notification to user (optional)

## 🎓 Testing Guide

### Test Credentials
Use KWIKAPI test environment:
- Test Mobile: `9876543210`
- Test DTH: `9988776655`
- Test Consumer: `123456789012`

### Test Flow
1. Add test balance to user wallet
2. Select test operator
3. Use test numbers
4. Process transaction
5. Verify in transaction history
6. Check commission credited

## 🌟 Best Practices

1. **Maintain Minimum Balance**
   - Keep ₹10,000+ in KWIKAPI wallet
   - Set up low balance alerts

2. **Monitor Transactions**
   - Check success rates daily
   - Investigate failed transactions
   - Verify commission calculations

3. **Cache Management**
   - Operator detection cached for 30 days
   - Plans cached and updated on fetch
   - Clear cache if data seems stale

4. **User Communication**
   - Show clear error messages
   - Display commission upfront
   - Provide transaction receipts

5. **Performance**
   - Use indexes on transaction queries
   - Paginate transaction history
   - Cache frequently accessed data

## 🔮 Future Enhancements

- [ ] SMS notifications on transaction success
- [ ] Email receipts with transaction details
- [ ] Bulk recharge upload (CSV)
- [ ] Scheduled recharges
- [ ] Favorite numbers/operators
- [ ] Transaction export (PDF/Excel)
- [ ] Advanced analytics dashboard
- [ ] Gas and water bill payments
- [ ] Broadband bill payments
- [ ] Insurance premium payments

## 📞 Support

### KWIKAPI Support
- Email: support@kwikapi.com
- Documentation: https://kwikapi.com/developers
- Postman Collection: Available in documentation

### Implementation Support
- Check transaction logs in database
- Review API response in `response_data` field
- Monitor KWIKAPI wallet balance
- Contact KWIKAPI for API issues

## ✅ Checklist

Before going live:

- [ ] Database migration executed
- [ ] KWIKAPI API key configured
- [ ] Test transactions successful
- [ ] Wallet balance sufficient
- [ ] Navigation links added
- [ ] User permissions configured
- [ ] Error handling tested
- [ ] Webhook URL configured in KWIKAPI
- [ ] Production URL updated in .env
- [ ] Low balance alerts set up

## 🎉 Conclusion

You now have a fully functional, professional recharge and bill payment system integrated with KWIKAPI. The system is:

- ✅ Production-ready
- ✅ User-friendly
- ✅ Secure and reliable
- ✅ Commission-enabled
- ✅ Fully automated
- ✅ Beautifully designed

Start processing recharges and earning commissions! 🚀
