# ✅ Updated Retailer Registration Flow

## 🔄 New Flow (Save After Payment)

### Previous Flow (CHANGED):
❌ Step 1: Fill details → **Save to database** → Get registration ID  
❌ Step 2: Pay → Update status

### New Flow (CURRENT):
✅ Step 1: Fill details → **Store in local state only** (no database save)  
✅ Step 2: Pay → **Payment successful** → Save to database + Create pending registration

---

## 📋 Detailed Flow

### Step 1: User Fills Details
**File:** `src/app/register/retailer/page.tsx`

1. User fills all fields (name, email, phone, address, etc.)
2. Click "Next: Proceed to Payment"
3. **Validation only** - No database save
4. Move to Step 2 (payment page)
5. **Data stored in React state** (formData)

### Step 2: Payment Process
**File:** `src/app/api/auth/register-retailer/create-payment/route.ts`

1. User clicks "Pay ₹1,499 Now"
2. Frontend sends registration details + payment request
3. Backend:
   - Validates all fields
   - Checks if email already exists
   - Hashes password
   - Creates Cashfree payment order
   - **Stores registration details in `cashfree_registration_payments.metadata`**
   - Returns payment_session_id
4. Cashfree payment modal opens
5. User completes payment

### Step 3: Payment Success (Webhook)
**File:** `src/app/api/wallet/cashfree/webhook/route.ts`

1. Cashfree sends webhook with payment status
2. If status = 'PAID':
   - Get registration details from `cashfree_registration_payments.metadata`
   - **NOW create `pending_registrations` entry**
   - Link payment to pending registration
   - Create admin notification
3. User redirected to success page

### Step 4: Admin Approval
**Admin Panel:** Pending Registrations

1. Admin sees new registration with "CASHFREE_PAID" status
2. Admin reviews and approves
3. System creates:
   - User account
   - Wallet
   - Retailer certificate
4. User can now login

---

## 🗄️ Database Flow

### Before Payment:
```
cashfree_registration_payments:
  - order_id: "REG-123456"
  - status: "CREATED"
  - metadata: {
      name: "John Doe",
      email: "john@example.com",
      phone: "9999999999",
      address: "123 Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      password_hash: "$2a$12$...",
      role: "RETAILER"
    }
  - pending_registration_id: NULL
```

### After Payment Success:
```
pending_registrations:
  - id: "uuid-123"
  - name: "John Doe"
  - email: "john@example.com"
  - phone: "9999999999"
  - address: "123 Street"
  - city: "Mumbai"
  - state: "Maharashtra"
  - pincode: "400001"
  - password_hash: "$2a$12$..."
  - role: "RETAILER"
  - status: "pending"
  - payment_screenshot_url: "CASHFREE_PAID_REG-123456"

cashfree_registration_payments:
  - order_id: "REG-123456"
  - status: "PAID"
  - pending_registration_id: "uuid-123" (NOW LINKED)
  - payment_time: "2025-11-14T..."
```

---

## 🔐 Security Benefits

1. **No Orphan Records**: Registration only created after successful payment
2. **Data Integrity**: All data validated before payment
3. **Payment Verification**: Registration linked to verified payment
4. **Rollback Safe**: If payment fails, no database records created

---

## 📁 Files Modified

### 1. Frontend
**File:** `src/app/register/retailer/page.tsx`
- ✅ Removed database save from Step 1
- ✅ Step 1 now only validates and moves to Step 2
- ✅ Step 2 sends all data with payment request

### 2. Backend - New Payment API
**File:** `src/app/api/auth/register-retailer/create-payment/route.ts` (NEW)
- ✅ Validates registration data
- ✅ Creates Cashfree payment order
- ✅ Stores registration details in payment metadata
- ✅ Returns payment_session_id

### 3. Backend - Webhook Handler
**File:** `src/app/api/wallet/cashfree/webhook/route.ts`
- ✅ Updated `handleRegistrationPayment` function
- ✅ Creates pending_registrations AFTER payment success
- ✅ Links payment to registration
- ✅ Creates admin notification

### 4. Backend - Old API (Not Used Anymore)
**File:** `src/app/api/auth/register-retailer/route.ts`
- ⚠️ This API is no longer called
- ⚠️ Can be deleted or kept for reference

---

## 🧪 Testing Steps

### Test Successful Payment:
1. Go to `/register/retailer`
2. Fill all details in Step 1
3. Click "Next: Proceed to Payment"
4. Verify Step 2 shows payment form
5. Click "Pay ₹1,499 Now"
6. Complete payment (use test card in sandbox)
7. **Check database:**
   - `cashfree_registration_payments` should have status='PAID'
   - `pending_registrations` should have new entry
   - Both should be linked via `pending_registration_id`
8. Admin approves registration
9. User can login

### Test Failed Payment:
1. Go to `/register/retailer`
2. Fill all details in Step 1
3. Click "Next: Proceed to Payment"
4. Click "Pay ₹1,499 Now"
5. Cancel payment or use failed test card
6. **Check database:**
   - `cashfree_registration_payments` should have status='FAILED'
   - `pending_registrations` should have NO entry
   - No orphan records created

---

## ✅ Advantages of New Flow

1. **Clean Database**: No pending registrations without payment
2. **Better UX**: User doesn't see "pending approval" until payment is done
3. **Easier Rollback**: Failed payments don't create database records
4. **Admin Clarity**: All pending registrations have verified payments
5. **Data Consistency**: Registration and payment always linked

---

## 🎯 Summary

**Old Flow:**
- Save → Pay → Approve ❌

**New Flow:**
- Validate → Pay → Save → Approve ✅

**Key Change:**
- Registration details stored in `cashfree_registration_payments.metadata` temporarily
- `pending_registrations` entry created ONLY after successful payment
- Webhook creates the registration record when payment is confirmed

---

**Updated:** November 14, 2025  
**Status:** ✅ Implemented and Ready to Test
