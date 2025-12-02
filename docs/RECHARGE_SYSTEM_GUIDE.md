# Recharge System Implementation Guide

## Overview
This document describes the comprehensive recharge and bill payment system integrated with KWIKAPI for mobile prepaid, postpaid, DTH, and electricity bill payments.

## Features Implemented

### 1. **Plan Categorization** ✅
- Plans are now organized by categories (DATA, STV, FULLTT, TOPUP, Planvoucher, etc.)
- Vertical category tabs for easy navigation
- Filter plans by category
- Categories are automatically extracted from KWIKAPI response

### 2. **Operator & Circle Auto-Detection** ✅
- Automatic operator detection based on mobile number
- Circle detection for prepaid services
- Manual selection fallback if auto-detection fails
- Detection cache to improve performance

### 3. **Bill Fetch for Postpaid & Electricity** ✅
- Fetch bill details before payment
- Display consumer name, bill amount, due date, etc.
- Auto-populate amount from fetched bill
- Support for operators with `bill_fetch = "YES"`

### 4. **Commission & Cashback System** ✅
- **Retailers**: Earn commission on all recharge types
- **Customers**: Earn random cashback (between min-max percentage)
- Admin configurable rates per operator
- Automatic wallet credit after successful transaction

### 5. **Pending Transaction Handling** ✅
- User-friendly messages for pending transactions
- Amount debited but transaction marked as pending
- Clear instructions to contact admin if not completed in 24 hours
- Prevents confusion when KWIKAPI wallet has insufficient balance

### 6. **Admin Configuration Panel** ✅
- Configure commission rates for retailers
- Enable/disable cashback for customers
- Set min/max cashback percentage per operator
- Bulk update for all operators in a service type
- Enable/disable operators

### 7. **Transaction Details Modal** ✅
- Real-time status updates
- Detailed amount breakdown
- Commission/cashback information
- Refresh status button
- Technical details for debugging

### 8. **Service-Specific Features** ✅

#### Mobile Prepaid
- Plan browsing by category
- Operator auto-detection
- Circle selection
- Commission for retailers, cashback for customers

#### Mobile Postpaid
- Bill fetch support
- Display bill details
- Pay exact due amount
- Commission for retailers, cashback for customers

#### DTH
- Plan browsing
- No circle required
- Commission for retailers, cashback for customers

#### Electricity Bill
- Bill fetch support
- Consumer details display
- Pay exact bill amount
- Lower commission/cashback rates

## Database Schema

### New Tables
```sql
-- Plan categories for organization
recharge_plan_categories (
  id, category_code, category_name, display_order, icon, is_active
)
```

### Updated Tables
```sql
-- Added cashback configuration
recharge_operators (
  ...existing fields,
  cashback_enabled BOOLEAN,
  cashback_min_percentage DECIMAL(5,2),
  cashback_max_percentage DECIMAL(5,2)
)

-- Added cashback tracking
recharge_transactions (
  ...existing fields,
  cashback_percentage DECIMAL(5,2),
  cashback_amount DECIMAL(10,2),
  cashback_claimed BOOLEAN,
  cashback_claimed_at TIMESTAMP,
  commission_paid BOOLEAN,
  commission_paid_at TIMESTAMP
)
```

## API Endpoints

### User Endpoints
- `GET /api/recharge/operators` - List operators by service type
- `GET /api/recharge/circles` - List all circles
- `GET /api/recharge/plans` - Fetch plans for operator/circle
- `POST /api/recharge/detect-operator` - Auto-detect operator from mobile
- `POST /api/recharge/fetch-bill` - Fetch bill details (postpaid/electricity)
- `POST /api/recharge/process` - Process recharge/bill payment
- `GET /api/recharge/transactions` - List user transactions
- `GET /api/recharge/transaction-status` - Get transaction status

### Admin Endpoints
- `GET /api/admin/recharge-config` - Get operator configurations
- `PUT /api/admin/recharge-config` - Update single operator config
- `POST /api/admin/recharge-config` - Bulk update operators

## User Flow

### Prepaid Recharge Flow
1. User selects "PREPAID" service type
2. Enters mobile number
3. Clicks "Detect" to auto-detect operator and circle (or selects manually)
4. Views plans organized by categories (DATA, STV, TOPUP, etc.)
5. Selects a plan or enters custom amount
6. Clicks "Proceed to Recharge"
7. System checks wallet balance
8. System checks KWIKAPI wallet balance
9. If sufficient: Processes recharge immediately
10. If insufficient KWIKAPI balance: Marks as PENDING with user-friendly message
11. On success: Credits commission (retailer) or cashback (customer) to wallet

### Postpaid/Electricity Flow
1. User selects "POSTPAID" or "ELECTRICITY"
2. Enters consumer/account number
3. Selects operator
4. Clicks "Fetch Bill" (if supported)
5. System displays bill details (name, amount, due date)
6. Amount auto-populated from bill
7. User confirms and proceeds
8. Same payment flow as prepaid

## Transaction Status Handling

### SUCCESS ✅
- Transaction completed successfully
- Commission/cashback credited to wallet
- User sees success message with reward amount

### PENDING ⏳
- Transaction submitted but not confirmed
- Amount debited from user wallet
- User sees: "Transaction is being processed. Amount debited. Contact admin if not completed in 24 hours."
- Admin can manually complete or refund

### FAILED ❌
- Transaction failed at KWIKAPI
- Amount automatically refunded to user wallet
- User sees: "Recharge failed. Amount refunded to your wallet."

### REFUNDED ↩️
- Admin manually refunded the transaction
- Amount returned to user wallet

## Commission & Cashback Configuration

### Default Rates
```
PREPAID:
  - Commission: 2.5%
  - Cashback: 0.5% - 2.0% (random)

DTH:
  - Commission: 2.0%
  - Cashback: 0.3% - 1.5% (random)

POSTPAID:
  - Commission: 1.5%
  - Cashback: 0.2% - 1.0% (random)

ELECTRICITY:
  - Commission: 1.0%
  - Cashback: 0.1% - 0.5% (random)
```

### Admin Configuration
1. Navigate to `/dashboard/admin/recharge-config`
2. Select service type (PREPAID, POSTPAID, DTH, ELECTRICITY)
3. Edit individual operator or bulk update all
4. Set commission rate for retailers
5. Enable/disable cashback for customers
6. Set min/max cashback percentage range
7. Enable/disable operator

## Error Handling

### Insufficient User Wallet Balance
- Error before transaction creation
- Message: "Insufficient wallet balance"
- No amount debited

### Insufficient KWIKAPI Wallet Balance
- Transaction created and marked as PENDING
- Amount debited from user wallet
- Message: "Transaction is being processed..."
- Admin notified to add balance and complete

### API Errors
- Transaction marked as PENDING (not FAILED)
- Amount debited from user wallet
- User sees pending message
- Admin can investigate and complete/refund

### Operator Not Active
- Error before transaction creation
- Message: "Operator is currently unavailable"

## Admin Actions for Pending Transactions

1. Check KWIKAPI wallet balance
2. Add balance if needed
3. Manually retry transaction using KWIKAPI transaction ID
4. Update transaction status in database
5. Credit commission/cashback if successful
6. Or refund to user wallet if failed

## Testing Checklist

### Prepaid Recharge
- [ ] Auto-detect operator from mobile number
- [ ] View plans by category
- [ ] Select plan and recharge
- [ ] Custom amount recharge
- [ ] Commission credited for retailer
- [ ] Cashback credited for customer
- [ ] Pending status handling
- [ ] Failed transaction refund

### Postpaid Bill Payment
- [ ] Fetch bill details
- [ ] Display bill information
- [ ] Pay bill amount
- [ ] Commission/cashback credited
- [ ] Pending status handling

### DTH Recharge
- [ ] View DTH plans
- [ ] Select plan and recharge
- [ ] Custom amount recharge
- [ ] Commission/cashback credited

### Electricity Bill Payment
- [ ] Fetch bill details
- [ ] Display consumer information
- [ ] Pay bill amount
- [ ] Lower commission/cashback rates applied

### Admin Configuration
- [ ] View all operators
- [ ] Edit single operator config
- [ ] Bulk update service type
- [ ] Enable/disable operators
- [ ] Changes reflected in user interface

## Security Considerations

1. **Authentication**: All endpoints require valid session
2. **Authorization**: Users can only see their own transactions (except admin)
3. **Wallet Validation**: Balance checked before transaction
4. **Transaction Integrity**: Unique transaction references prevent duplicates
5. **Refund Safety**: Automatic refunds on failure
6. **Admin Only**: Configuration endpoints restricted to admin role

## Performance Optimizations

1. **Operator Detection Cache**: 30-day cache for detected operators
2. **Plan Caching**: Plans cached per operator/circle combination
3. **Database Indexes**: Indexes on frequently queried fields
4. **Lazy Loading**: Plans loaded only when operator selected
5. **Pagination**: Transaction list paginated (50 per page)

## Future Enhancements

1. **Scheduled Status Checks**: Cron job to check pending transactions
2. **Webhook Integration**: KWIKAPI callback handling
3. **SMS Notifications**: Send SMS on transaction completion
4. **Email Receipts**: Email transaction receipts
5. **Analytics Dashboard**: Transaction analytics for admin
6. **Operator Performance**: Track success rates per operator
7. **Bulk Recharge**: Upload CSV for multiple recharges
8. **API Rate Limiting**: Prevent abuse
9. **Transaction Export**: Export transactions to Excel/PDF
10. **Refund Requests**: User-initiated refund requests

## Support & Troubleshooting

### Common Issues

**Issue**: Plans not loading
- **Solution**: Check operator has kwikapi_opid configured
- **Solution**: Verify KWIKAPI API key is valid
- **Solution**: Check operator is active

**Issue**: Transaction stuck in PENDING
- **Solution**: Check KWIKAPI wallet balance
- **Solution**: Check KWIKAPI transaction status API
- **Solution**: Manually complete or refund

**Issue**: Cashback not credited
- **Solution**: Verify cashback_enabled for operator
- **Solution**: Check transaction status is SUCCESS
- **Solution**: Verify cashback_claimed is false

**Issue**: Bill fetch not working
- **Solution**: Verify operator has bill_fetch = "YES"
- **Solution**: Check consumer number format
- **Solution**: Verify KWIKAPI API response

## Contact

For technical support or questions:
- Check KWIKAPI documentation: https://www.kwikapi.com/docs
- Review transaction logs in database
- Contact KWIKAPI support for API issues
- Check admin panel for configuration issues

---

**Last Updated**: December 2, 2025
**Version**: 1.0.0
