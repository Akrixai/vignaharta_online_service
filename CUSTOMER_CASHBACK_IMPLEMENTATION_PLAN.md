# Customer & Cashback System Implementation Plan

## 📋 Overview
This document outlines the complete implementation plan for:
1. **Two-step Retailer Registration** with Cashfree payment integration
2. **Simple Customer Registration** (no payment required)
3. **Customer Dashboard** with cashback system instead of commission
4. **Scratch Card Feature** for cashback rewards
5. **Admin Panel Updates** for cashback configuration

---

## 🗄️ Database Changes Required

### 1. Add Cashback Fields to `schemes` Table
```sql
-- Add cashback configuration for customers
ALTER TABLE schemes 
ADD COLUMN cashback_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN cashback_min_percentage NUMERIC(5,2) DEFAULT 1.00 CHECK (cashback_min_percentage >= 0 AND cashback_min_percentage <= 100),
ADD COLUMN cashback_max_percentage NUMERIC(5,2) DEFAULT 3.00 CHECK (cashback_max_percentage >= 0 AND cashback_max_percentage <= 100);

-- Add comment
COMMENT ON COLUMN schemes.cashback_enabled IS 'Whether cashback is enabled for customers on this service';
COMMENT ON COLUMN schemes.cashback_min_percentage IS 'Minimum cashback percentage for customers (1-3%)';
COMMENT ON COLUMN schemes.cashback_max_percentage IS 'Maximum cashback percentage for customers (1-3%)';
```

### 2. Add Cashback Fields to `applications` Table
```sql
-- Add cashback tracking for customer applications
ALTER TABLE applications
ADD COLUMN cashback_percentage NUMERIC(5,2) DEFAULT 0,
ADD COLUMN cashback_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN cashback_claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN cashback_claimed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN scratch_card_revealed BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN applications.cashback_percentage IS 'Random cashback percentage awarded to customer';
COMMENT ON COLUMN applications.cashback_amount IS 'Calculated cashback amount';
COMMENT ON COLUMN applications.cashback_claimed IS 'Whether cashback has been added to wallet';
COMMENT ON COLUMN applications.scratch_card_revealed IS 'Whether customer has revealed the scratch card';
```

### 3. Update `users` Table
```sql
-- Already has commission_enabled field, we'll use it to differentiate
-- CUSTOMER role will have commission_enabled = FALSE by default
-- This field already exists in your schema
```

### 4. Create `cashfree_registration_payments` Table
```sql
-- Track Cashfree payments for retailer registrations
CREATE TABLE cashfree_registration_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pending_registration_id UUID REFERENCES pending_registrations(id) ON DELETE CASCADE,
    order_id VARCHAR(255) UNIQUE NOT NULL,
    cf_order_id VARCHAR(255),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'ACTIVE', 'PAID', 'EXPIRED', 'CANCELLED', 'FAILED')),
    payment_session_id TEXT,
    payment_method VARCHAR(100),
    payment_time TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    webhook_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cfr_pending_registration ON cashfree_registration_payments(pending_registration_id);
CREATE INDEX idx_cfr_order_id ON cashfree_registration_payments(order_id);
CREATE INDEX idx_cfr_status ON cashfree_registration_payments(status);

COMMENT ON TABLE cashfree_registration_payments IS 'Tracks Cashfree payments for retailer registration fees';
```

---

## 🔄 Registration Flow Changes

### Current State
- **Retailer**: Manual QR code payment → Admin approval
- **Customer**: No separate registration (uses same form)

### New State

#### **Retailer Registration (2-Step Process)**

**Step 1: Details Form**
- Name, Email, Phone
- Address, City, State, Pincode
- Password, Confirm Password
- Terms & Conditions

**Step 2: Payment Form**
- Display registration fee (from `registration_fees` table)
- Amount is **non-editable** (read-only)
- Integrate **Cashfree Payment Gateway** (same as wallet page)
- Payment options: UPI, Cards, Net Banking
- On successful payment → Create pending registration → Redirect to success page
- On failed payment → Show error → Allow retry

**Payment Flow:**
1. User submits Step 1 → Validate data
2. Show Step 2 with Cashfree payment
3. Create Cashfree order with registration fee
4. User completes payment
5. Webhook receives payment status
6. If PAID → Create `pending_registrations` entry with status='pending_payment_verified'
7. Admin approves → Create user account + wallet
8. Redirect to dashboard

#### **Customer Registration (Simple)**
- Single form with customer details only
- No payment required
- Fields: Name, Email, Phone, Address, City, State, Pincode, Password
- On submit → Create user directly with role='CUSTOMER'
- Create wallet automatically
- Set `commission_enabled = FALSE`
- Redirect to customer dashboard immediately

---

## 🎨 Frontend Implementation

### 1. Retailer Registration Form (`src/app/register/page.tsx`)

**Changes Required:**
- Add state management for 2-step form
- Step 1: Collect all user details
- Step 2: Show Cashfree payment integration
- Remove QR code upload section
- Add payment success/failure handling
- Integrate with Cashfree SDK (already available via `useCashfree` hook)

**Key Components:**
```typescript
const [step, setStep] = useState(1); // 1 or 2
const [formData, setFormData] = useState({...});
const [registrationFee, setRegistrationFee] = useState(0);

// Step 1: Details form
// Step 2: Payment form with Cashfree
```

### 2. Customer Registration Form (`src/app/register/customer/page.tsx`)

**New File Required:**
- Simple single-step form
- No payment integration
- Direct account creation
- Immediate dashboard access

### 3. Customer Dashboard (`src/app/dashboard/page.tsx`)

**Changes Required:**
- Detect user role (CUSTOMER vs RETAILER)
- Show different dashboard layout for customers
- Remove commission-related features for customers
- Add cashback-related features
- Show "Cashback Earned" instead of "Commission Earned"
- Display scratch card feature for completed applications

**Customer Dashboard Features:**
- Wallet balance
- Available services (same as retailer)
- Applications history
- Cashback earned (instead of commission)
- Scratch cards for completed applications
- Profile management

### 4. Scratch Card Component (`src/components/ScratchCard.tsx`)

**New Component Required:**
```typescript
interface ScratchCardProps {
  applicationId: string;
  cashbackAmount: number;
  cashbackPercentage: number;
  onReveal: () => void;
}

// Features:
// - Canvas-based scratch effect
// - Reveal cashback amount
// - Confetti animation on reveal
// - Auto-add to wallet after reveal
```

### 5. Admin Panel Updates

#### **Services Management** (`src/app/dashboard/admin/services/page.tsx`)

**Add Cashback Configuration:**
- Toggle: "Enable Cashback for Customers"
- Input: "Min Cashback %" (1-3%)
- Input: "Max Cashback %" (1-3%)
- Keep existing commission fields for retailers

**Form Fields:**
```typescript
{
  commission_rate: number, // For retailers
  cashback_enabled: boolean, // For customers
  cashback_min_percentage: number, // 1-3%
  cashback_max_percentage: number, // 1-3%
}
```

#### **Registration Fee Management** (Already exists)
- Keep existing functionality
- Used for retailer registration payment

---

## 🔌 Backend API Changes

### 1. Registration APIs

#### **Retailer Registration** (`src/app/api/auth/register/route.ts`)

**Changes:**
- Remove direct user creation
- Create Cashfree order for registration fee
- Store payment details in `cashfree_registration_payments`
- Create `pending_registrations` only after successful payment
- Return payment session ID for frontend

#### **Customer Registration** (`src/app/api/auth/register-customer/route.ts`)

**New API Required:**
- Direct user creation with role='CUSTOMER'
- Set `commission_enabled = FALSE`
- Create wallet automatically
- No payment required
- Return success + redirect to dashboard

### 2. Cashfree Webhook Handler (`src/app/api/webhooks/cashfree/route.ts`)

**Update Existing Webhook:**
- Handle registration payments separately
- Check if payment is for registration or wallet
- Update `cashfree_registration_payments` status
- Create `pending_registrations` entry on successful payment
- Send email notification to user and admin

### 3. Application APIs

#### **Create Application** (`src/app/api/applications/route.ts`)

**Changes:**
- Check if user is CUSTOMER
- If customer → Calculate random cashback percentage
- Store cashback details in application
- Don't add cashback to wallet yet (wait for scratch card reveal)

#### **Reveal Scratch Card** (`src/app/api/applications/[id]/reveal-cashback/route.ts`)

**New API Required:**
```typescript
POST /api/applications/[id]/reveal-cashback

// Logic:
// 1. Verify application belongs to customer
// 2. Check if already revealed
// 3. Mark scratch_card_revealed = true
// 4. Add cashback to wallet
// 5. Create transaction record
// 6. Return cashback details
```

### 4. Admin APIs

#### **Update Service** (`src/app/api/admin/services/[id]/route.ts`)

**Changes:**
- Add cashback fields to update logic
- Validate cashback percentages (1-3%)
- Ensure min <= max

---

## 📊 Business Logic

### Cashback Calculation

```typescript
function calculateCashback(
  servicePrice: number,
  minPercentage: number,
  maxPercentage: number
): { percentage: number; amount: number } {
  // Generate random percentage between min and max
  const percentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
  const roundedPercentage = Math.round(percentage * 100) / 100; // 2 decimal places
  
  // Calculate amount
  const amount = (servicePrice * roundedPercentage) / 100;
  const roundedAmount = Math.round(amount * 100) / 100;
  
  return {
    percentage: roundedPercentage,
    amount: roundedAmount
  };
}
```

### Commission vs Cashback Logic

```typescript
function getRewardForUser(user: User, application: Application) {
  if (user.role === 'CUSTOMER') {
    // Customer gets cashback
    return {
      type: 'CASHBACK',
      percentage: application.cashback_percentage,
      amount: application.cashback_amount,
      requiresScratch: true
    };
  } else if (user.role === 'RETAILER' && user.commission_enabled) {
    // Retailer gets commission
    return {
      type: 'COMMISSION',
      percentage: application.commission_rate,
      amount: application.commission_amount,
      requiresScratch: false
    };
  }
  
  return null;
}
```

---

## 🎯 Implementation Steps

### Phase 1: Database Setup (READ-ONLY for Production)
✅ Document all SQL changes (done above)
⚠️ **DO NOT EXECUTE** - Only document for manual execution

### Phase 2: Backend APIs
1. Create customer registration API
2. Update retailer registration API with Cashfree
3. Create scratch card reveal API
4. Update application creation logic
5. Update Cashfree webhook handler
6. Update admin service management API

### Phase 3: Frontend Components
1. Create 2-step retailer registration form
2. Create customer registration form
3. Create scratch card component
4. Update customer dashboard
5. Update admin services management
6. Add cashback display components

### Phase 4: Testing
1. Test retailer registration with Cashfree
2. Test customer registration
3. Test cashback calculation
4. Test scratch card reveal
5. Test wallet credit after scratch
6. Test admin cashback configuration

### Phase 5: Deployment
1. Backup database
2. Execute SQL migrations
3. Deploy backend changes
4. Deploy frontend changes
5. Test in production
6. Monitor for issues

---

## 🔒 Security Considerations

1. **Payment Security**
   - Use Cashfree's secure payment gateway
   - Verify webhook signatures
   - Store sensitive data encrypted

2. **Cashback Fraud Prevention**
   - One scratch card per application
   - Verify application ownership
   - Log all cashback transactions
   - Admin audit trail

3. **Registration Security**
   - Validate all input data
   - Prevent duplicate registrations
   - Rate limit registration attempts
   - Email verification (optional)

---

## 📝 Notes

- **Current Registration Fee**: ₹1,499 (from database)
- **Cashback Range**: 1-3% (configurable per service)
- **Customer Role**: No commission, only cashback
- **Retailer Role**: Commission system (existing)
- **Scratch Card**: One-time reveal per application
- **Wallet Integration**: Existing Cashfree integration can be reused

---

## 🚀 Next Steps

1. Review this plan with stakeholders
2. Get approval for database changes
3. Create development branch
4. Implement Phase 2 (Backend APIs)
5. Implement Phase 3 (Frontend)
6. Test thoroughly
7. Deploy to production

---

**Document Version**: 1.0  
**Last Updated**: November 14, 2025  
**Status**: Ready for Implementation
