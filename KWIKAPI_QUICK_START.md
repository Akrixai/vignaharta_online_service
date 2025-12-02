# KWIKAPI Integration - Quick Start Guide 🚀

## ✅ What's Been Implemented

A complete, production-ready recharge and bill payment system with:

- 📱 **Prepaid Mobile Recharge** - All major operators (Airtel, Jio, VI, BSNL)
- 📞 **Postpaid Bill Payment** - Pay mobile postpaid bills
- 📺 **DTH Recharge** - Tata Sky, Dish TV, Sun Direct, Videocon, Big TV
- ⚡ **Electricity Bill Payment** - Major state electricity boards
- 💰 **Commission System** - Automatic commission calculation and crediting
- 🔍 **Auto-Detection** - Detect operator and circle from mobile number
- 📊 **Transaction History** - Complete transaction tracking
- 💳 **Wallet Management** - KWIKAPI wallet balance monitoring

## 🎯 Quick Setup (5 Minutes)

### Step 1: Get Your KWIKAPI API Key

1. Visit https://kwikapi.com
2. Sign up for an account
3. Get your API key from dashboard
4. Copy the API key

### Step 2: Configure Environment

Open `.env` file and update:

```env
KWIKAPI_API_KEY="paste_your_actual_api_key_here"
```

That's it! The system is ready to use.

## 🎨 Access the Features

### For Users/Retailers

**Main Recharge Page:**
```
http://localhost:3000/dashboard/recharge
```

**Transaction History:**
```
http://localhost:3000/dashboard/recharge/transactions
```

### For Admin

**KWIKAPI Wallet Dashboard:**
```
http://localhost:3000/dashboard/admin/kwikapi-wallet
```

## 📱 How to Use

### Prepaid Recharge

1. Go to `/dashboard/recharge`
2. Select "PREPAID" tab
3. Enter mobile number
4. Click "Detect" to auto-detect operator
5. Browse plans or enter custom amount
6. Click "Proceed to Prepaid Recharge"
7. Done! Commission credited automatically

### DTH Recharge

1. Select "DTH" tab
2. Enter DTH subscriber ID
3. Select operator (Tata Sky, Dish TV, etc.)
4. Browse available plans
5. Click on a plan to select
6. Submit recharge
7. Commission earned!

### Electricity Bill Payment

1. Select "ELECTRICITY" tab
2. Enter consumer number
3. Select electricity board
4. Select your circle/state
5. Enter bill amount
6. Pay bill
7. Earn commission!

## 💰 Commission Structure

| Service | Commission Rate | Example |
|---------|----------------|---------|
| Prepaid | 2.0% - 3.0% | ₹499 recharge = ₹12.48 commission |
| Postpaid | 1.0% - 1.5% | ₹500 bill = ₹7.50 commission |
| DTH | 2.0% | ₹299 recharge = ₹5.98 commission |
| Electricity | 1.0% | ₹1500 bill = ₹15.00 commission |

**Platform Fee:** ₹2 per transaction

## 🎯 Key Features

### 1. Auto-Detect Operator
- Enter mobile number
- Click "Detect"
- Operator and circle auto-filled
- Saves time!

### 2. Browse Plans
- Plans load automatically
- See data, voice, SMS benefits
- Click to select
- Amount auto-filled

### 3. Real-time Processing
- Instant transaction processing
- Success/failure notification
- Automatic refund on failure
- Commission credited immediately

### 4. Transaction History
- View all transactions
- Filter by status or service
- See commission earned
- Export data (coming soon)

### 5. Wallet Management (Admin)
- Monitor KWIKAPI balance
- Low balance alerts
- Refresh balance anytime
- API status monitoring

## 🔧 Admin Tasks

### Check Wallet Balance

1. Go to `/dashboard/admin/kwikapi-wallet`
2. Click "Refresh Balance"
3. View available balance
4. Monitor low balance alerts

### View All Transactions

1. Go to `/dashboard/recharge/transactions`
2. See all users' transactions
3. Filter by status or service
4. Monitor success rates

### Manage Operators

Operators are pre-configured. To add more:

```sql
INSERT INTO recharge_operators (
  operator_code, 
  operator_name, 
  service_type, 
  min_amount, 
  max_amount, 
  commission_rate
) VALUES (
  'NEW_OP', 
  'New Operator', 
  'PREPAID', 
  10, 
  5000, 
  2.5
);
```

## 🎨 UI Highlights

### Modern Design
- ✨ Beautiful gradient cards
- 🎯 Easy service type tabs
- 📱 Fully responsive
- 🎨 Color-coded status badges
- 💫 Smooth animations

### User Experience
- 🔍 One-click operator detection
- 📋 Visual plan selection
- 💰 Real-time commission display
- ✅ Clear success/error messages
- 📊 Transaction analytics

## 🔐 Security

- ✅ Authentication required
- ✅ User-specific transactions
- ✅ Secure API communication
- ✅ Automatic refunds
- ✅ Transaction logging

## 📊 Database Tables Created

- `recharge_operators` - All operators
- `recharge_circles` - Telecom circles
- `recharge_plans` - Cached plans
- `recharge_transactions` - Transaction history
- `kwikapi_wallet` - Wallet balance
- `bill_fetch_history` - Bill fetch logs
- `operator_detection_cache` - Detection cache

## 🚀 Testing

### Test Numbers (Use in Development)

- **Mobile:** 9876543210
- **DTH:** 9988776655
- **Consumer:** 123456789012

### Test Flow

1. Add ₹1000 to user wallet
2. Go to recharge page
3. Use test mobile number
4. Select any operator
5. Enter ₹10 amount
6. Process transaction
7. Check transaction history
8. Verify commission credited

## 💡 Tips

1. **Maintain Balance:** Keep ₹10,000+ in KWIKAPI wallet
2. **Monitor Transactions:** Check success rates daily
3. **Cache Benefits:** Operator detection cached for 30 days
4. **Commission Rates:** Customize per operator in database
5. **Low Balance:** Set up alerts when balance < ₹5,000

## 🎯 Navigation Links

Add these to your dashboard menu:

```tsx
// Main navigation
<Link href="/dashboard/recharge">
  📱 Recharge & Bills
</Link>

<Link href="/dashboard/recharge/transactions">
  📊 Transaction History
</Link>

// Admin only
{user.role === 'ADMIN' && (
  <Link href="/dashboard/admin/kwikapi-wallet">
    💰 KWIKAPI Wallet
  </Link>
)}
```

## 📈 Analytics

View in transaction history:
- Total transactions
- Success rate
- Total commission earned
- Service type distribution

## 🔄 Webhook Setup

KWIKAPI will send callbacks to:
```
https://yourdomain.com/api/recharge/callback
```

Configure this URL in your KWIKAPI dashboard.

## 🆘 Troubleshooting

### "Insufficient wallet balance"
- Add funds to user wallet
- Check wallet balance in dashboard

### "Operator detection failed"
- Select operator manually
- Check if mobile number is valid

### "Transaction failed"
- Check KWIKAPI wallet balance
- Verify API key is correct
- Check operator is active

### "Low KWIKAPI balance"
- Contact KWIKAPI support
- Add funds to KWIKAPI wallet
- Minimum ₹10,000 recommended

## 📞 Support

### KWIKAPI Support
- Email: support@kwikapi.com
- Website: https://kwikapi.com
- Documentation: https://kwikapi.com/developers

### Implementation Issues
- Check `.env` configuration
- Verify database migration ran
- Review API logs in browser console
- Check transaction table for errors

## 🎉 You're Ready!

Your recharge system is fully functional and ready to process transactions. Start earning commissions today!

### Next Steps:
1. ✅ Configure KWIKAPI API key
2. ✅ Add funds to KWIKAPI wallet
3. ✅ Test with small transactions
4. ✅ Add navigation links
5. ✅ Go live and earn! 🚀

---

**Need Help?** Check the detailed guide: `KWIKAPI_IMPLEMENTATION_GUIDE.md`
