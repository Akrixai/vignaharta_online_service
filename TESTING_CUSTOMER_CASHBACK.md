# Customer Cashback System - Testing Guide

## Quick Test Steps

### 1. Fix Wallet 500 Error ✅
**Test**: Login as customer and check dashboard
- Navigate to `/dashboard`
- Wallet balance should display without errors
- Check browser console - no 500 errors

**Expected**: Wallet balance shows correctly (₹0.00 for new customers)

### 2. Admin Service Configuration ✅

**Test**: Configure a service for customers
1. Login as ADMIN
2. Go to `/dashboard/admin/services`
3. Click "Add Service" or edit existing service
4. Scroll to **"Customer Settings"** section
5. Enable "Show to Customers" toggle
6. (Optional) Set customer price: e.g., ₹100
7. Scroll to **"Cashback for Customers"** section
8. Enable "Enable Cashback" toggle
9. Set Min Cashback: 1%
10. Set Max Cashback: 3%
11. Save service

**Expected**: Service saved with customer configurations

### 3. Customer Service Visibility ✅

**Test**: Customer sees only enabled services
1. Login as CUSTOMER
2. Go to `/dashboard/services`
3. Verify filter section sticks to top when scrolling
4. Check services displayed

**Expected**: 
- Only services with `show_to_customer = true` appear
- Customer price shown if set (not regular price)
- Filter section remains visible when scrolling

### 4. Apply for Service ✅

**Test**: Customer applies for cashback-enabled service
1. As CUSTOMER, click "Apply Now" on a service
2. Fill out application form
3. Submit application

**Expected**: 
- Application created successfully
- Random cashback percentage calculated (1-3%)
- Cashback amount calculated based on service price
- Status: PENDING

### 5. Approve Application (Admin) ✅

**Test**: Admin approves customer application
1. Login as ADMIN or EMPLOYEE
2. Go to `/dashboard/applications`
3. Find customer's application
4. Approve it

**Expected**: Application status changes to APPROVED

### 6. Scratch Card Reveal ✅

**Test**: Customer reveals scratch card
1. Login as CUSTOMER
2. Go to `/dashboard/customer/cashback`
3. Find approved application
4. Click on scratch card or use "Skip & Reveal" button

**Expected**:
- Scratch card reveals cashback percentage
- Cashback amount displayed
- Celebration animation plays
- `scratch_card_revealed = true`

### 7. Claim Cashback ✅

**Test**: Customer claims cashback to wallet
1. After revealing scratch card
2. Click "Claim" button
3. Check wallet balance

**Expected**:
- Cashback amount added to wallet
- Transaction created (type: DEPOSIT)
- `cashback_claimed = true`
- Success message displayed

### 8. Verify Transaction ✅

**Test**: Check transaction history
1. As CUSTOMER, go to `/dashboard/transactions`
2. Find cashback transaction

**Expected**:
- Transaction type: DEPOSIT
- Description: "Cashback from [service name]"
- Reference: CASHBACK_[application_id]
- Amount matches cashback amount

## Test Scenarios

### Scenario 1: Full Customer Journey
```
1. Admin creates service with cashback (1-3%)
2. Customer applies for service (₹500)
3. Admin approves application
4. Customer reveals scratch card → 2.5% cashback
5. Cashback amount: ₹12.50
6. Customer claims cashback
7. Wallet balance: ₹12.50
8. Transaction recorded
```

### Scenario 2: Customer-Specific Pricing
```
1. Admin sets service:
   - Regular price: ₹500
   - Customer price: ₹400
2. Retailer sees: ₹500
3. Customer sees: ₹400
4. Customer applies and pays: ₹400
5. Cashback calculated on: ₹400
```

### Scenario 3: Hidden from Customers
```
1. Admin disables "Show to Customers"
2. Retailer can see and apply
3. Customer cannot see service
4. API filters it out for customers
```

### Scenario 4: Multiple Cashback Applications
```
1. Customer applies for 3 services
2. All approved
3. Customer has 3 scratch cards
4. Reveals all 3 (different percentages)
5. Claims all 3
6. Total cashback added to wallet
```

## API Testing

### Test Wallet API
```bash
# Should return wallet without 500 error
curl -X GET http://localhost:3000/api/wallet \
  -H "Cookie: next-auth.session-token=..."
```

### Test Schemes API (Customer)
```bash
# Should only return customer-visible schemes
curl -X GET http://localhost:3000/api/schemes \
  -H "Cookie: next-auth.session-token=..."
```

### Test Cashback API
```bash
# Get cashback applications
curl -X GET http://localhost:3000/api/customer/cashback \
  -H "Cookie: next-auth.session-token=..."

# Reveal scratch card
curl -X POST http://localhost:3000/api/customer/cashback/reveal \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"applicationId": "uuid-here"}'

# Claim cashback
curl -X POST http://localhost:3000/api/customer/cashback/claim \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"applicationId": "uuid-here"}'
```

## Database Verification

### Check Customer Wallets
```sql
SELECT u.name, u.email, w.balance, w.created_at
FROM users u
JOIN wallets w ON u.id = w.user_id
WHERE u.role = 'CUSTOMER';
```

### Check Cashback Applications
```sql
SELECT 
  a.id,
  a.customer_name,
  a.amount,
  a.cashback_percentage,
  a.cashback_amount,
  a.scratch_card_revealed,
  a.cashback_claimed,
  s.name as service_name
FROM applications a
JOIN schemes s ON a.scheme_id = s.id
WHERE a.cashback_amount > 0
ORDER BY a.created_at DESC;
```

### Check Cashback Transactions
```sql
SELECT 
  t.id,
  t.amount,
  t.description,
  t.reference,
  t.created_at,
  u.name as customer_name
FROM transactions t
JOIN users u ON t.user_id = u.id
WHERE t.reference LIKE 'CASHBACK_%'
ORDER BY t.created_at DESC;
```

### Check Service Configurations
```sql
SELECT 
  name,
  price,
  customer_price,
  show_to_customer,
  cashback_enabled,
  cashback_min_percentage,
  cashback_max_percentage,
  customer_cashback_percentage
FROM schemes
WHERE is_active = true
ORDER BY created_at DESC;
```

## Common Issues & Solutions

### Issue 1: Wallet 500 Error
**Symptom**: Error when loading customer dashboard
**Solution**: ✅ Fixed - API now handles multiple wallets gracefully

### Issue 2: Duplicate Wallets
**Symptom**: Multiple wallet entries for same user
**Solution**: ✅ Fixed - Added unique constraint and cleanup migration

### Issue 3: Services Not Showing for Customer
**Symptom**: Customer sees no services
**Solution**: Check `show_to_customer` flag in admin panel

### Issue 4: Cashback Not Calculated
**Symptom**: Application has 0 cashback
**Solution**: Verify `cashback_enabled = true` on scheme

### Issue 5: Cannot Claim Cashback
**Symptom**: Claim button doesn't work
**Solution**: Ensure scratch card is revealed first

## Performance Checks

### Page Load Times
- Dashboard: < 2s
- Services page: < 3s
- Cashback page: < 2s

### API Response Times
- GET /api/wallet: < 500ms
- GET /api/schemes: < 1s
- POST /api/customer/cashback/claim: < 1s

### Database Queries
- Check for N+1 queries
- Verify indexes are used
- Monitor slow query log

## Security Checks

### Role-Based Access
- ✅ Only CUSTOMER can access cashback endpoints
- ✅ Only ADMIN can configure services
- ✅ Users can only see their own data

### Data Validation
- ✅ Cashback percentage: 0-100%
- ✅ Amount validation
- ✅ User ID verification

### Transaction Integrity
- ✅ Wallet balance updates atomically
- ✅ Transaction records created
- ✅ Application status updated

## Browser Testing

### Desktop
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Mobile
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Touch events work
- ✅ Responsive layout

## Accessibility

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast
- ✅ Focus indicators

## Final Checklist

- [ ] Wallet API returns 200 for customers
- [ ] Services filter correctly by role
- [ ] Sticky filter works on scroll
- [ ] Admin can configure customer settings
- [ ] Customer can apply for services
- [ ] Cashback calculated correctly
- [ ] Scratch card reveals properly
- [ ] Cashback credits to wallet
- [ ] Transactions recorded
- [ ] No duplicate wallets
- [ ] No test data in database
- [ ] All APIs return proper errors
- [ ] Mobile responsive
- [ ] Touch events work

## Success Criteria

✅ **All features working**
✅ **No 500 errors**
✅ **Data integrity maintained**
✅ **User experience smooth**
✅ **Security validated**

---

**Ready for Production**: After completing all tests above
**Estimated Test Time**: 30-45 minutes
**Test Date**: November 26, 2025
